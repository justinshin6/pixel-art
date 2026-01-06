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
  recent_puzzle_ids: string[];
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

// Puzzle types
export interface Puzzle {
  id: string;
  difficulty_type: 'easy' | 'medium' | 'hard';
  target_grid: string[][];
  available_grids: string[][][];
  solution_indices: number[];
  created_at: string;
  updated_at: string;
}

// Puzzle Functions
export async function getPuzzlesByDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('difficulty_type', difficulty);

  if (error) throw error;
  return data as Puzzle[];
}

export async function getRandomPuzzleByDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
  const puzzles = await getPuzzlesByDifficulty(difficulty);
  
  if (!puzzles || puzzles.length === 0) {
    throw new Error(`No puzzles found for difficulty: ${difficulty}`);
  }
  
  // Return a random puzzle from the list
  const randomIndex = Math.floor(Math.random() * puzzles.length);
  return puzzles[randomIndex];
}

export async function getAllPuzzles() {
  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .order('difficulty_type', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Puzzle[];
}

// Add a puzzle ID to the user's recent puzzles queue (max 100, FIFO)
export async function addPuzzleToRecentQueue(userId: string, puzzleId: string) {
  // Get current user's recent puzzles
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('recent_puzzle_ids')
    .eq('id', userId)
    .single();

  if (fetchError) throw fetchError;

  // Ensure we have an array and all IDs are strings
  let recentPuzzles: string[] = [];
  if (userData?.recent_puzzle_ids) {
    if (Array.isArray(userData.recent_puzzle_ids)) {
      recentPuzzles = userData.recent_puzzle_ids.map(id => String(id));
    }
  }
  
  // Ensure puzzleId is a string
  const puzzleIdStr = String(puzzleId);
  
  console.log('Adding puzzle to queue:', puzzleIdStr, 'type:', typeof puzzleIdStr);
  console.log('Existing queue:', recentPuzzles);
  console.log('Existing queue length:', recentPuzzles.length);
  
  // Remove the puzzle if it already exists in the queue
  recentPuzzles = recentPuzzles.filter(id => String(id) !== puzzleIdStr);
  
  // Add the new puzzle to the end
  recentPuzzles.push(puzzleIdStr);
  
  console.log('Updated queue:', recentPuzzles);
  console.log('Updated queue length:', recentPuzzles.length);
  
  // If queue exceeds 100, remove from the front (FIFO)
  if (recentPuzzles.length > 100) {
    recentPuzzles = recentPuzzles.slice(-100); // Keep only the last 100
  }

  // Update the user's recent puzzles
  const { error: updateError } = await supabase
    .from('users')
    .update({ recent_puzzle_ids: recentPuzzles })
    .eq('id', userId);

  if (updateError) throw updateError;
  
  return recentPuzzles;
}

// Get a random puzzle that the user hasn't played recently
export async function getUnplayedPuzzleByDifficulty(
  userId: string | null, 
  difficulty: 'easy' | 'medium' | 'hard',
  guestPlayedPuzzles?: string[] // For guest users - in-memory tracking
) {
  // Get all puzzles of the specified difficulty
  const allPuzzles = await getPuzzlesByDifficulty(difficulty);
  
  if (!allPuzzles || allPuzzles.length === 0) {
    return null; // No puzzles available for this difficulty
  }

  // If no user is logged in (guest user), use in-memory tracking
  if (!userId) {
    const guestRecentIds = (guestPlayedPuzzles || []).map(id => String(id).trim());
    
    console.log('🎮 GUEST FILTERING MODE');
    console.log('Guest played IDs (cleaned):', guestRecentIds);
    console.log('All puzzles for difficulty:', difficulty, allPuzzles.map(p => ({ id: p.id, type: typeof p.id })));
    
    // Filter out played puzzles for guests
    const unplayedPuzzles = allPuzzles.filter(puzzle => {
      const puzzleIdStr = String(puzzle.id).trim();
      const isPlayed = guestRecentIds.includes(puzzleIdStr);
      console.log(`Guest - Comparing: "${puzzleIdStr}" against [${guestRecentIds.join(', ')}]`);
      console.log(`Guest - Puzzle ${puzzleIdStr} - isPlayed: ${isPlayed}`);
      return !isPlayed;
    });
    
    console.log('Guest - Unplayed puzzles count:', unplayedPuzzles.length);
    console.log('Guest - Unplayed puzzle IDs:', unplayedPuzzles.map(p => p.id));
    
    if (unplayedPuzzles.length === 0) {
      console.log('Guest has played all available puzzles for this difficulty');
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * unplayedPuzzles.length);
    const selectedPuzzle = unplayedPuzzles[randomIndex];
    console.log('Guest - Selected puzzle:', selectedPuzzle.id);
    return selectedPuzzle;
  }

  // Get user's recent puzzles (logged-in user)
  const { data: userData, error } = await supabase
    .from('users')
    .select('recent_puzzle_ids')
    .eq('id', userId)
    .single();

  if (error) {
    // If error fetching user data, just return a random puzzle
    const randomIndex = Math.floor(Math.random() * allPuzzles.length);
    return allPuzzles[randomIndex];
  }

  // Ensure recentPuzzleIds is an array and convert all IDs to strings
  let recentPuzzleIds: string[] = [];
  if (userData?.recent_puzzle_ids) {
    if (Array.isArray(userData.recent_puzzle_ids)) {
      recentPuzzleIds = userData.recent_puzzle_ids.map(id => String(id));
    } else {
      console.warn('recent_puzzle_ids is not an array:', userData.recent_puzzle_ids);
    }
  }
  
  // Debug logging
  console.log('Recent puzzle IDs:', recentPuzzleIds);
  console.log('Recent puzzle IDs length:', recentPuzzleIds.length);
  console.log('All puzzles for difficulty:', difficulty, allPuzzles.map(p => ({ id: p.id, type: typeof p.id })));
  
  // Filter out recently played puzzles - ensure both IDs are strings for comparison
  const unplayedPuzzles = allPuzzles.filter(puzzle => {
    const puzzleIdStr = String(puzzle.id);
    const isPlayed = recentPuzzleIds.includes(puzzleIdStr);
    console.log(`Puzzle ${puzzleIdStr} - isPlayed: ${isPlayed}`);
    return !isPlayed;
  });
  
  console.log('Unplayed puzzles count:', unplayedPuzzles.length);
  console.log('Unplayed puzzle IDs:', unplayedPuzzles.map(p => p.id));

  // If no unplayed puzzles are available, show "no puzzles left" screen
  if (unplayedPuzzles.length === 0) {
    console.log('No unplayed puzzles available for this user/difficulty');
    return null; // User has played all available puzzles in their recent queue
  }

  // Return a random unplayed puzzle
  const randomIndex = Math.floor(Math.random() * unplayedPuzzles.length);
  const selectedPuzzle = unplayedPuzzles[randomIndex];
  console.log('Selected puzzle:', selectedPuzzle.id);
  return selectedPuzzle;
}

