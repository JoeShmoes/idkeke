
// WORKSPACE_KEY_HOLDER from storage.ts
const WORKSPACE_KEY_HOLDER = 'contextflow-workspace-key';

/**
 * Replicated logic from src/lib/storage.ts for verification
 */
const getScopedKeyLocal = (baseKey, pathname, roomId) => {
  const workspaceKey = 'test-user-id';
  let currentRoomId = roomId;
  const isCollaboration = pathname.includes('/collaboration/');
  
  if (isCollaboration && !currentRoomId) {
    const roomMatch = pathname.match(/\/collaboration\/([^\/]+)(?:\/|$)/);
    if (roomMatch && roomMatch[1]) {
      currentRoomId = roomMatch[1];
    }
  }

  // ONLY for active collaboration rooms, use room-specific keys
  if (isCollaboration && currentRoomId) {
    return workspaceKey ? `${workspaceKey}_room_${currentRoomId}_${baseKey}` : `room_${currentRoomId}_${baseKey}`;
  }

  // All other data is global to the workspace
  return workspaceKey ? `${workspaceKey}_${baseKey}` : baseKey;
};

const baseKey = 'notes-data';
console.log('Testing scoping for different paths:');
console.log('Path: /dashboard ->', getScopedKeyLocal(baseKey, '/dashboard'));
console.log('Path: /mail      ->', getScopedKeyLocal(baseKey, '/mail'));
console.log('Path: /tasks     ->', getScopedKeyLocal(baseKey, '/tasks'));
console.log('Path: /collaboration/room-123 ->', getScopedKeyLocal(baseKey, '/collaboration/room-123'));
console.log('Path: /collaboration/room-456 ->', getScopedKeyLocal(baseKey, '/collaboration/room-456'));

// Validation
const dashboardKey = getScopedKeyLocal(baseKey, '/dashboard');
const mailKey = getScopedKeyLocal(baseKey, '/mail');
const tasksKey = getScopedKeyLocal(baseKey, '/tasks');
const collab123Key = getScopedKeyLocal(baseKey, '/collaboration/room-123');
const collab456Key = getScopedKeyLocal(baseKey, '/collaboration/room-456');

if (dashboardKey === mailKey && mailKey === tasksKey) {
  console.log('SUCCESS: Global data keys are consistent across non-collaboration paths.');
} else {
  console.log('FAILURE: Global data keys are NOT consistent!');
  process.exit(1);
}

if (collab123Key !== collab456Key && collab123Key !== dashboardKey) {
  console.log('SUCCESS: Collaboration room data is properly isolated.');
} else {
  console.log('FAILURE: Collaboration isolation test failed!');
  process.exit(1);
}
