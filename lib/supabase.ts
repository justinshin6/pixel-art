import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  last_visited: string;
}

export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

// Auth Functions
export async function signUp({ email, password, username }: SignUpData) {
  // Step 1: Create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (error) throw error;
  
  // Step 2: Manually insert into users table
  if (data.user?.id) {
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: email,
        username: username,
      });
    
    if (insertError) {
      throw new Error(`Account created but profile failed: ${insertError.message}`);
    }
  }
  
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Get user profile from public.users table
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as User;
}

// Get current user's profile
export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const profile = await getUserProfile(user.id);
  return profile;
}

// Check if session is still valid
export async function isSessionValid() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

// Refresh the current session
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return data;
}

