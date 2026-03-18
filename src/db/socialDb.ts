import * as Crypto from 'expo-crypto';
import { getDb } from '../lib/database';

export interface ProfileExport {
  version: '1.0';
  id: string; // Profile UUID
  username: string;
  display_name: string;
  bio: string;
  avatar_path: string; // Used as emoji or URI
  is_public: 0 | 1;
  exported_at: string;
  stats: {
    total_workouts: number;
    total_volume_kg: number;
    current_streak: number;
    best_streak: number;
    total_steps: number;
    achievements_count: number;
    week_workouts: number;
    week_calories_avg: number;
    week_steps_avg: number;
  };
  achievements: Array<{ key: string; title: string; icon: string }>;
}

export const socialDb = {
  async upsertFriendProfile(profile: ProfileExport) {
    const db = await getDb();
    const now = new Date().toISOString();
    const json = JSON.stringify(profile);
    
    // Using social_connections to store friends for this serverless module
    await db.runAsync(
      `INSERT INTO social_connections (follower_username, following_username, profile_json, synced_at, created_at) 
       VALUES ('me', ?, ?, ?, ?)
       ON CONFLICT(following_username) DO UPDATE SET 
       profile_json = excluded.profile_json, 
       synced_at = excluded.synced_at`,
      [profile.username, json, now, now]
    );

    // Update group contributions if this friend is in any shared groups
    // We update their contribution based on the latest sync to reflecting the group goal type
    const groups: any[] = await this.getMyGroups();
    for (const g of groups) {
      let contrib = 0;
      switch (g.shared_goal_type) {
        case 'steps': contrib = profile.stats.week_steps_avg * 7; break; // Simple estimation for week
        case 'workouts': contrib = profile.stats.week_workouts; break;
        case 'calories': contrib = profile.stats.week_calories_avg; break;
        case 'streak_days': contrib = profile.stats.current_streak; break;
      }
      await db.runAsync(
        `UPDATE group_members SET last_contribution = ?, last_synced_at = ? 
         WHERE group_id_ref = ? AND username = ?`,
        [contrib, now, g.group_id, profile.username]
      );
    }
  },

  async getStoredFriends(): Promise<ProfileExport[]> {
    const db = await getDb();
    const rows: any[] = await db.getAllAsync('SELECT profile_json FROM social_connections WHERE follower_username = "me"');
    return rows.map(r => JSON.parse(r.profile_json));
  },

  async getMyProfileSettings() {
    const db = await getDb();
    return await db.getFirstAsync('SELECT * FROM social_profile LIMIT 1');
  },

  async updateMyProfile(data: { username: string, display_name: string, bio: string, avatar_path: string, is_public: number, share_workouts: number, share_nutrition: number, share_steps: number, share_achievements: number }) {
    const db = await getDb();
    const existing: any = await db.getFirstAsync('SELECT id FROM social_profile LIMIT 1');
    if (existing) {
      await db.runAsync(
        `UPDATE social_profile SET username=?, display_name=?, bio=?, avatar_path=?, is_public=?, 
         share_workouts=?, share_nutrition=?, share_steps=?, share_achievements=? WHERE id=?`,
        [data.username, data.display_name, data.bio, data.avatar_path, data.is_public, 
         data.share_workouts, data.share_nutrition, data.share_steps, data.share_achievements, existing.id]
      );
    } else {
      const uuid = Crypto.randomUUID();
      await db.runAsync(
        `INSERT INTO social_profile (username, display_name, bio, avatar_path, is_public, 
         share_workouts, share_nutrition, share_steps, share_achievements, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`,
        [data.username, data.display_name, data.bio, data.avatar_path, data.is_public, 
         data.share_workouts, data.share_nutrition, data.share_steps, data.share_achievements]
      );
    }
  },

  async generateExportPayload(): Promise<ProfileExport | null> {
    const db = await getDb();
    const profile: any = await db.getFirstAsync('SELECT * FROM social_profile LIMIT 1');
    if (!profile) return null;

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Stats calculations
    const workouts: any = await db.getFirstAsync('SELECT COUNT(*) as count, SUM(total_volume) as volume FROM workout_sessions');
    const weekWorkouts: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM workout_sessions WHERE date >= ?', [sevenDaysAgoStr]);
    const steps: any = await db.getFirstAsync('SELECT SUM(step_count) as total FROM step_logs');
    const weekSteps: any = await db.getFirstAsync('SELECT AVG(step_count) as avg FROM step_logs WHERE date >= ?', [sevenDaysAgoStr]);
    const nutrition: any = await db.getFirstAsync('SELECT AVG(daily_cal) as avg FROM (SELECT date, SUM(calories) as daily_cal FROM food_entries WHERE date >= ? GROUP BY date)', [sevenDaysAgoStr]);
    const achievements: any[] = await db.getAllAsync('SELECT achievement_type as key, name as title FROM achievements');
    const streaks: any = await db.getFirstAsync('SELECT current_count, best_count FROM streaks WHERE type = "workout"');

    const stats = {
      total_workouts: (profile.is_public && profile.share_workouts) ? (workouts.count || 0) : 0,
      total_volume_kg: (profile.is_public && profile.share_workouts) ? (workouts.volume || 0) : 0,
      current_streak: (profile.is_public && profile.share_workouts) ? (streaks?.current_count || 0) : 0,
      best_streak: (profile.is_public && profile.share_workouts) ? (streaks?.best_count || 0) : 0,
      total_steps: (profile.is_public && profile.share_steps) ? (steps.total || 0) : 0,
      achievements_count: (profile.is_public && profile.share_achievements) ? achievements.length : 0,
      week_workouts: (profile.is_public && profile.share_workouts) ? (weekWorkouts.count || 0) : 0,
      week_calories_avg: (profile.is_public && profile.share_nutrition) ? (nutrition?.avg || 0) : -1,
      week_steps_avg: (profile.is_public && profile.share_steps) ? (weekSteps.avg || 0) : 0,
    };

    return {
      version: '1.0',
      id: profile.id.toString(), // Simplified ID for local sync
      username: profile.username,
      display_name: profile.display_name,
      bio: profile.bio,
      avatar_path: profile.avatar_path,
      is_public: profile.is_public,
      exported_at: new Date().toISOString(),
      stats,
  achievements: (profile.is_public && profile.share_achievements) ? achievements.map(a => ({ key: a.key, title: a.title, icon: 'medal' })) : []
    };
  },

  // GROUP OPERATIONS
  async createGroup(data: { name: string, description: string, icon: string, creator: string, goalType: string, goalTarget: number, period: string, group_id: string }) {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO community_groups (group_id, name, description, icon, creator_username, member_count, shared_goal_type, shared_goal_target, goal_period, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
      [data.group_id, data.name, data.description, data.icon, data.creator, data.goalType, data.goalTarget, data.period, now]
    );
    // Add self as member
    const profile: any = await this.getMyProfileSettings();
    await db.runAsync(
      `INSERT INTO group_members (group_id_ref, username, display_name, avatar, joined_at, last_contribution, last_synced_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [data.group_id, profile.username, profile.display_name, profile.avatar_path, now, now]
    );
  },

  async getMyGroups() {
    const db = await getDb();
    const rows: any[] = await db.getAllAsync(`
      SELECT g.*, (SELECT COUNT(*) FROM group_members WHERE group_id_ref = g.group_id) as current_members
      FROM community_groups g
    `);
    return rows;
  },

  async getGroupDetail(groupId: string) {
    const db = await getDb();
    const group: any = await db.getFirstAsync('SELECT * FROM community_groups WHERE group_id = ?', [groupId]);
    const members: any[] = await db.getAllAsync(`
      SELECT m.*, c.profile_json 
      FROM group_members m
      LEFT JOIN social_connections c ON m.username = c.following_username
      WHERE m.group_id_ref = ?
    `, [groupId]);

    // Parse achievements for each member
    const processedMembers = await Promise.all(members.map(async m => {
      let achievements = [];
      if (m.profile_json) {
        achievements = JSON.parse(m.profile_json).achievements || [];
      } else {
        // It's likely me, fetch my own real-time achievements
        const myAchievements: any[] = await db.getAllAsync('SELECT achievement_type as key, name as title FROM achievements');
        achievements = myAchievements.map(a => ({ key: a.key, title: a.title, icon: 'medal' }));
      }
      return { ...m, achievements };
    }));

    return { group, members: processedMembers };
  },

  async updateMemberContribution(groupId: string, username: string, contribution: number) {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE group_members SET last_contribution = ?, last_synced_at = ? WHERE group_id_ref = ? AND username = ?`,
      [contribution, now, groupId, username]
    );
  },

  async joinGroup(data: { group_id: string, name: string, description: string, icon: string, creator: string, goalType: string, goalTarget: number, period: string }) {
    const db = await getDb();
    const now = new Date().toISOString();
    
    // Check if group already exists locally
    const existing = await db.getFirstAsync('SELECT id FROM community_groups WHERE group_id = ?', [data.group_id]);
    if (!existing) {
      await db.runAsync(
        `INSERT INTO community_groups (group_id, name, description, icon, creator_username, member_count, shared_goal_type, shared_goal_target, goal_period, created_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
        [data.group_id, data.name, data.description, data.icon, data.creator, data.goalType, data.goalTarget, data.period, now]
      );
    }
    
    // Add self to group_members if not already
    const myProfile: any = await this.getMyProfileSettings();
    const isMember = await db.getFirstAsync('SELECT id FROM group_members WHERE group_id_ref = ? AND username = ?', [data.group_id, myProfile.username]);
    if (!isMember) {
      await db.runAsync(
        `INSERT INTO group_members (group_id_ref, username, display_name, avatar, joined_at, last_contribution, last_synced_at)
         VALUES (?, ?, ?, ?, ?, 0, ?)`,
        [data.group_id, myProfile.username, myProfile.display_name, myProfile.avatar_path, now, now]
      );
    }
  },

  async leaveGroup(groupId: string) {
    const db = await getDb();
    await db.runAsync('DELETE FROM community_groups WHERE group_id = ?', [groupId]);
    await db.runAsync('DELETE FROM group_members WHERE group_id_ref = ?', [groupId]);
  },

  // FEED OPERATIONS
  async createPost(data: { 
    text: string, 
    mediaPath?: string, 
    workoutId?: number, 
    nutritionSummary?: string, 
    isPublic: number,
    aiApproved?: number,
    category: string
  }) {
    const db = await getDb();
    const profile: any = await this.getMyProfileSettings();
    if (!profile) throw new Error('You must set up a profile to post.');
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO feed_posts (author_username, text_content, media_path, workout_ref_id, nutrition_summary, is_public, ai_approved, category, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [profile.username, data.text, data.mediaPath || null, data.workoutId || null, data.nutritionSummary || null, data.isPublic, 1, data.category, now]
    );
  },

  async createStory(data: { mediaPath: string, text?: string }) {
    const db = await getDb();
    const profile: any = await this.getMyProfileSettings();
    if (!profile) throw new Error('Setup profile first.');
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
    await db.runAsync(
      `INSERT INTO stories (author_username, media_path, text_content, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [profile.username, data.mediaPath, data.text || null, now.toISOString(), expires.toISOString()]
    );
  },

  async getRecentWorkouts() {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM workout_sessions ORDER BY date DESC LIMIT 5');
  },

  async getMyPosts() {
    const db = await getDb();
    const profile: any = await this.getMyProfileSettings();
    if (!profile) return [];
    return await db.getAllAsync('SELECT * FROM feed_posts WHERE author_username = ? ORDER BY created_at DESC', [profile.username]);
  },

  async reportPost(postId: number, reason: string) {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync('INSERT INTO reported_posts (post_id, reason, reported_at) VALUES (?, ?, ?)', [postId, reason, now]);
  },

  async deletePost(postId: number) {
    const db = await getDb();
    await db.runAsync('DELETE FROM feed_posts WHERE id = ?', [postId]);
    await db.runAsync('DELETE FROM post_comments WHERE post_id = ?', [postId]);
    await db.runAsync('DELETE FROM post_likes WHERE post_id = ?', [postId]);
  },

  async toggleLike(postId: number) {
    const db = await getDb();
    const profile: any = await this.getMyProfileSettings();
    if (!profile) return;
    
    const existing = await db.getFirstAsync('SELECT * FROM post_likes WHERE post_id = ? AND username = ?', [postId, profile.username]);
    if (existing) {
      await db.runAsync('DELETE FROM post_likes WHERE post_id = ? AND username = ?', [postId, profile.username]);
      await db.runAsync('UPDATE feed_posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?', [postId]);
      return false;
    } else {
      await db.runAsync('INSERT INTO post_likes (post_id, username) VALUES (?, ?)', [postId, profile.username]);
      await db.runAsync('UPDATE feed_posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);
      return true;
    }
  },

  async addComment(postId: number, text: string) {
    const db = await getDb();
    const profile: any = await this.getMyProfileSettings();
    if (!profile) throw new Error('Setup profile first.');
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO post_comments (post_id, username, display_name, avatar, text, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [postId, profile.username, profile.display_name, profile.avatar_path, text, now]
    );
  },

  async getComments(postId: number) {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM post_comments WHERE post_id = ? ORDER BY created_at ASC', [postId]);
  },

  async getStories() {
    const db = await getDb();
    const profile: any = await this.getMyProfileSettings();
    const now = new Date().toISOString();
    
    // Cleanup expired stories
    await db.runAsync('DELETE FROM stories WHERE expires_at < ?', [now]);

    // Fetch active stories
    const storyRows: any[] = await db.getAllAsync(`
      SELECT st.*, sp.avatar_path
      FROM stories st
      JOIN social_profile sp ON st.author_username = sp.username
      ORDER BY st.created_at DESC
    `);
    
    const storiesMapping: Record<string, any> = {};
    storyRows.forEach(row => {
      if (!storiesMapping[row.author_username]) {
        storiesMapping[row.author_username] = {
          username: row.author_username,
          avatar: row.avatar_path,
          isSeen: false,
          id: row.author_username
        };
      }
    });

    const stories = Object.values(storiesMapping);
    
    if (profile && !stories.find(s => s.username === profile.username)) {
      stories.unshift({
        username: 'Your Story',
        avatar: profile.avatar_path,
        isSeen: true,
        id: 'me'
      });
    }
    return stories;
  },

  async getFeedPosts() {
    const db = await getDb();
    const profile: any = await this.getMyProfileSettings();
    const myUser = profile?.username || 'me';

    const rows: any[] = await db.getAllAsync(`
      SELECT p.*, s.display_name, s.avatar_path,
      w.name as workout_name, w.total_volume, w.duration_minutes,
      (SELECT COUNT(*) FROM reported_posts r WHERE r.post_id = p.id) as report_count,
      (SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id) as comments_count,
      (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id AND l.username = ?) as is_liked
      FROM feed_posts p
      JOIN social_profile s ON p.author_username = s.username
      LEFT JOIN workout_sessions w ON p.workout_ref_id = w.id
      WHERE report_count = 0
      ORDER BY p.created_at DESC
    `, [myUser]);
    return rows;
  },
};
