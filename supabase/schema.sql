-- IronTrack Database Schema
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
    theme_preference TEXT DEFAULT 'light' CHECK (theme_preference IN ('light', 'hardcore', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. EXERCISES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT CHECK (category IN ('barbell', 'dumbbell', 'machine', 'bodyweight', 'cable', 'other')),
    is_bodyweight BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Exercise policies (users can see their own + global exercises where user_id is null)
CREATE POLICY "Users can view exercises" ON exercises
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own exercises" ON exercises
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises" ON exercises
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercises" ON exercises
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. SESSIONS TABLE (Workouts)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    day_type TEXT NOT NULL CHECK (day_type IN ('push', 'pull', 'legs', 'other')),
    day_type_label TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
    total_volume NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. SESSION_EXERCISES TABLE (Join table)
-- ============================================
CREATE TABLE IF NOT EXISTS session_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;

-- Session exercises policies (via session ownership)
CREATE POLICY "Users can view own session exercises" ON session_exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_exercises.session_id 
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own session exercises" ON session_exercises
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_exercises.session_id 
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own session exercises" ON session_exercises
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_exercises.session_id 
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own session exercises" ON session_exercises
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_exercises.session_id 
            AND sessions.user_id = auth.uid()
        )
    );

-- ============================================
-- 5. SETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_exercise_id UUID NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    weight NUMERIC,
    reps INTEGER NOT NULL,
    rpe NUMERIC CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
    notes TEXT,
    est_1rm NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

-- Sets policies (via session ownership)
CREATE POLICY "Users can view own sets" ON sets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM session_exercises se
            JOIN sessions s ON s.id = se.session_id
            WHERE se.id = sets.session_exercise_id 
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own sets" ON sets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM session_exercises se
            JOIN sessions s ON s.id = se.session_id
            WHERE se.id = sets.session_exercise_id 
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own sets" ON sets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM session_exercises se
            JOIN sessions s ON s.id = se.session_id
            WHERE se.id = sets.session_exercise_id 
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own sets" ON sets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM session_exercises se
            JOIN sessions s ON s.id = se.session_id
            WHERE se.id = sets.session_exercise_id 
            AND s.user_id = auth.uid()
        )
    );

-- ============================================
-- 6. TRIGGERS & FUNCTIONS
-- ============================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate estimated 1RM (Epley formula)
CREATE OR REPLACE FUNCTION calculate_est_1rm(weight NUMERIC, reps INTEGER)
RETURNS NUMERIC AS $$
BEGIN
    IF weight IS NULL OR reps IS NULL OR reps = 0 THEN
        RETURN NULL;
    END IF;
    -- Epley formula: 1RM = weight × (1 + reps/30)
    RETURN ROUND(weight * (1 + reps::NUMERIC / 30), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-calculate est_1rm on set insert/update
CREATE OR REPLACE FUNCTION auto_calculate_est_1rm()
RETURNS TRIGGER AS $$
BEGIN
    NEW.est_1rm = calculate_est_1rm(NEW.weight, NEW.reps);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_est_1rm_trigger ON sets;
CREATE TRIGGER calculate_est_1rm_trigger
    BEFORE INSERT OR UPDATE ON sets
    FOR EACH ROW EXECUTE FUNCTION auto_calculate_est_1rm();

-- ============================================
-- 7. SEED DATA (Default Global Exercises)
-- ============================================
INSERT INTO exercises (user_id, name, category, is_bodyweight) VALUES
    (NULL, 'Bench Press', 'barbell', FALSE),
    (NULL, 'Incline Bench Press', 'barbell', FALSE),
    (NULL, 'Dumbbell Bench Press', 'dumbbell', FALSE),
    (NULL, 'Overhead Press', 'barbell', FALSE),
    (NULL, 'Dumbbell Shoulder Press', 'dumbbell', FALSE),
    (NULL, 'Tricep Pushdown', 'cable', FALSE),
    (NULL, 'Tricep Dips', 'bodyweight', TRUE),
    (NULL, 'Push-Ups', 'bodyweight', TRUE),
    (NULL, 'Chest Fly', 'cable', FALSE),
    (NULL, 'Lateral Raises', 'dumbbell', FALSE),
    (NULL, 'Deadlift', 'barbell', FALSE),
    (NULL, 'Barbell Row', 'barbell', FALSE),
    (NULL, 'Pull-Ups', 'bodyweight', TRUE),
    (NULL, 'Chin-Ups', 'bodyweight', TRUE),
    (NULL, 'Lat Pulldown', 'cable', FALSE),
    (NULL, 'Seated Cable Row', 'cable', FALSE),
    (NULL, 'Dumbbell Row', 'dumbbell', FALSE),
    (NULL, 'Face Pulls', 'cable', FALSE),
    (NULL, 'Bicep Curls', 'dumbbell', FALSE),
    (NULL, 'Hammer Curls', 'dumbbell', FALSE),
    (NULL, 'Squat', 'barbell', FALSE),
    (NULL, 'Front Squat', 'barbell', FALSE),
    (NULL, 'Leg Press', 'machine', FALSE),
    (NULL, 'Romanian Deadlift', 'barbell', FALSE),
    (NULL, 'Leg Curl', 'machine', FALSE),
    (NULL, 'Leg Extension', 'machine', FALSE),
    (NULL, 'Lunges', 'bodyweight', TRUE),
    (NULL, 'Bulgarian Split Squat', 'dumbbell', FALSE),
    (NULL, 'Calf Raises', 'machine', FALSE),
    (NULL, 'Hip Thrust', 'barbell', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================
-- DONE! Your database is ready.
-- ============================================

