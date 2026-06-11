const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DB_FILE = path.join(__dirname, 'mock-db.json');

// Load DB from file
let db = {
  users: [],
  attendance: [],
  face_embeddings: [],
  queries: []
};

const loadDb = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
      console.log(`[Mock DB] Successfully loaded database state from ${DB_FILE}`);
    } else {
      console.log(`[Mock DB] DB file not found. Creating default state.`);
      saveDb();
    }
  } catch (e) {
    console.error(`[Mock DB] Failed to parse db file. Resetting. Error:`, e);
  }
};

const saveDb = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error(`[Mock DB] Failed to write database state:`, e);
  }
};

// Initialize on start
loadDb();

// Helper to write JSON responses
const sendJSON = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

// Helper to parse authorization token (retrieves user roles)
const getRequesterRole = (req) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { username: null, isAdmin: false, userId: null };
  }
  
  const token = authHeader.substring(7);
  // Decode simulated token fields
  if (token === 'admin-jwt-token-signature') {
    return { username: 'admin', isAdmin: true, userId: 1 };
  }
  
  // Custom tokens: e.g., "token-for-userId-X"
  if (token.startsWith('token-for-user-')) {
    const username = token.replace('token-for-user-', '');
    const user = db.users.find(u => u.username === username);
    if (user) {
      return { 
        username: user.username, 
        isAdmin: user.roles.includes('ROLE_ADMIN'), 
        userId: user.id 
      };
    }
  }
  
  return { username: 'employee', isAdmin: false, userId: 2 };
};

const server = http.createServer((req, res) => {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(`[Mock Server] ${req.method} ${url.pathname}`);

  // 1. JWT Login Endpoints
  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const { username, password } = parsed;
        
        // Find user in database
        const user = db.users.find(u => u.username === username);
        if (!user) {
          sendJSON(res, 401, { message: 'Authentication failed: User profile not found.' });
          return;
        }
        
        // Active check
        if (user.status !== 'ACTIVE') {
          sendJSON(res, 403, { message: 'Authentication failed: Profile status is suspended.' });
          return;
        }

        // Return a mock token mapping to username credentials
        const mockToken = username === 'admin' ? 'admin-jwt-token-signature' : `token-for-user-${username}`;
        
        sendJSON(res, 200, {
          token: mockToken,
          username: user.username,
          roles: user.roles
        });
      } catch (e) {
        sendJSON(res, 400, { message: 'Malformed JSON payload' });
      }
    });
    return;
  }

  if (url.pathname === '/api/auth/me' && req.method === 'GET') {
    const requester = getRequesterRole(req);
    if (!requester.username) {
      sendJSON(res, 401, { message: 'Unauthorized session' });
      return;
    }
    const user = db.users.find(u => u.username === requester.username);
    if (!user) {
      sendJSON(res, 404, { message: 'User not found' });
      return;
    }
    sendJSON(res, 200, user);
    return;
  }

  // 2. User CRUD Management (Admin or Public Registration)
  if (url.pathname === '/api/users' && req.method === 'GET') {
    sendJSON(res, 200, db.users);
    return;
  }

  if (url.pathname === '/api/users' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const newUser = JSON.parse(body);
        
        // Double check username uniqueness
        if (db.users.some(u => u.username === newUser.username)) {
          sendJSON(res, 400, { message: 'Username is already registered!' });
          return;
        }
        if (db.users.some(u => u.email === newUser.email)) {
          sendJSON(res, 400, { message: 'Email address is already registered!' });
          return;
        }

        newUser.id = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
        newUser.status = 'ACTIVE';
        
        db.users.push(newUser);
        saveDb();
        
        console.log(`[Mock DB] Created user account: ${newUser.username}`);
        sendJSON(res, 201, newUser);
      } catch (e) {
        sendJSON(res, 400, { message: 'Error compiling user profile.' });
      }
    });
    return;
  }

  if (url.pathname.startsWith('/api/users/') && req.method === 'PUT') {
    const id = parseInt(url.pathname.split('/').pop());
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const updatedFields = JSON.parse(body);
        const idx = db.users.findIndex(u => u.id === id);
        
        if (idx === -1) {
          sendJSON(res, 404, { message: 'User not found' });
          return;
        }

        db.users[idx] = { ...db.users[idx], ...updatedFields };
        saveDb();
        
        console.log(`[Mock DB] Updated user: ${db.users[idx].username}`);
        sendJSON(res, 200, db.users[idx]);
      } catch (e) {
        sendJSON(res, 400, { message: 'Error updating user profile.' });
      }
    });
    return;
  }

  if (url.pathname.startsWith('/api/users/') && req.method === 'DELETE') {
    const id = parseInt(url.pathname.split('/').pop());
    const idx = db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      const username = db.users[idx].username;
      db.users.splice(idx, 1);
      // Clean embeddings
      db.face_embeddings = db.face_embeddings.filter(fe => fe.userId !== id);
      saveDb();
      console.log(`[Mock DB] Deleted user: ${username}`);
      res.writeHead(204);
      res.end();
    } else {
      sendJSON(res, 404, { message: 'User not found' });
    }
    return;
  }

  // 3. Biometrics Enrollment & Face Recognition Matching
  if (url.pathname === '/api/faces/enroll' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { userId, images } = payload;
        
        const user = db.users.find(u => u.id === userId);
        if (!user) {
          sendJSON(res, 404, { message: 'User profile not found' });
          return;
        }

        // Clean previous enrollments for fresh registration
        db.face_embeddings = db.face_embeddings.filter(fe => fe.userId !== userId);
        
        // Save base64 face snapshots (actual image bytes) to db
        db.face_embeddings.push({
          userId,
          username: user.username,
          fullName: `${user.firstName} ${user.lastName}`,
          templates: images // array of base64 images
        });
        
        saveDb();
        console.log(`[Mock Biometrics] Successfully enrolled actual face templates for: ${user.username}`);
        sendJSON(res, 200, { success: true, message: 'Actual face templates enrolled successfully!' });
      } catch (e) {
        sendJSON(res, 400, { message: 'Error processing enrollment data' });
      }
    });
    return;
  }

  if (url.pathname === '/api/faces/recognize' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const scanFrame = payload.image; // scan base64 image
        
        // BIOMETRIC COMPARATOR SIMULATION:
        // Match them to the most recently registered user.
        if (db.face_embeddings.length === 0) {
          sendJSON(res, 200, {
            matched: false,
            confidence: 28.5,
            status: 'UNKNOWN',
            message: 'No facial models registered in database. Access Denied.'
          });
          return;
        }

        // Find the matched profile (last enrolled)
        const matchProfile = db.face_embeddings[db.face_embeddings.length - 1];
        const matchedUser = db.users.find(u => u.id === matchProfile.userId);
        
        if (!matchedUser || matchedUser.status !== 'ACTIVE') {
          sendJSON(res, 200, {
            matched: false,
            confidence: 32.1,
            status: 'FAILURE',
            message: 'Access Denied: Matched account is suspended or inactive.'
          });
          return;
        }

        // Biometrics matched! Mark daily attendance.
        const today = new Date().toISOString().split('T')[0];
        let attendanceStatus = 'CLOCKED_IN';
        
        const existingRecord = db.attendance.find(a => a.userId === matchedUser.id && a.date === today);
        if (existingRecord) {
          existingRecord.clockOut = new Date().toISOString();
          attendanceStatus = 'CLOCKED_OUT';
        } else {
          db.attendance.push({
            id: Date.now(),
            userId: matchedUser.id,
            user: matchedUser,
            date: today,
            clockIn: new Date().toISOString(),
            clockOut: null,
            status: new Date().getHours() >= 9 ? 'LATE' : 'PRESENT'
          });
        }
        
        saveDb();
        console.log(`[Mock Biometrics] Face matched for: ${matchedUser.username}. Attendance: ${attendanceStatus}`);
        
        sendJSON(res, 200, {
          matched: true,
          confidence: 98.7,
          userId: matchedUser.id,
          username: matchedUser.username,
          fullName: `${matchedUser.firstName} ${matchedUser.lastName}`,
          status: 'SUCCESS',
          message: `Biometrics match verified. Welcome, ${matchedUser.firstName}! Action: ${attendanceStatus}`
        });
      } catch (e) {
        sendJSON(res, 400, { message: 'Biometric scan parsing error' });
      }
    });
    return;
  }

  // 4. Helpdesk Queries Module
  if (url.pathname === '/api/queries' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const requester = getRequesterRole(req);
        if (!requester.username) {
          sendJSON(res, 401, { message: 'Unauthorized session' });
          return;
        }

        const ticket = JSON.parse(body);
        const user = db.users.find(u => u.id === requester.userId);
        
        const newQuery = {
          id: Date.now(),
          userId: user.id,
          username: user.username,
          fullName: `${user.firstName} ${user.lastName}`,
          subject: ticket.subject,
          message: ticket.message,
          status: 'PENDING',
          adminRemarks: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        db.queries.push(newQuery);
        saveDb();
        
        console.log(`[Helpdesk] New query submitted by employee: ${user.username}`);
        sendJSON(res, 201, newQuery);
      } catch (e) {
        sendJSON(res, 400, { message: 'Error saving query' });
      }
    });
    return;
  }

  if (url.pathname === '/api/queries' && req.method === 'GET') {
    const requester = getRequesterRole(req);
    if (!requester.username) {
      sendJSON(res, 401, { message: 'Unauthorized session' });
      return;
    }

    if (requester.isAdmin) {
      sendJSON(res, 200, db.queries);
    } else {
      const employeeTickets = db.queries.filter(q => q.userId === requester.userId);
      sendJSON(res, 200, employeeTickets);
    }
    return;
  }

  if (url.pathname.startsWith('/api/queries/') && req.method === 'PUT') {
    const id = parseInt(url.pathname.split('/').pop());
    const requester = getRequesterRole(req);
    
    if (!requester.isAdmin) {
      sendJSON(res, 403, { message: 'Forbidden: Admins only' });
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { status, adminRemarks } = payload;
        
        const queryIdx = db.queries.findIndex(q => q.id === id);
        if (queryIdx === -1) {
          sendJSON(res, 404, { message: 'Query not found' });
          return;
        }

        const query = db.queries[queryIdx];
        query.status = status; // RESOLVED or REJECTED
        query.adminRemarks = adminRemarks;
        query.updatedAt = new Date().toISOString();

        // QUERY-ATTENDANCE RESOLUTION LINKAGE:
        const isAttendanceQuery = query.subject.toLowerCase().includes('attendance') || 
                                  query.subject.toLowerCase().includes('clock') ||
                                  query.subject.toLowerCase().includes('punch') ||
                                  query.message.toLowerCase().includes('forgot');
        
        if (status === 'RESOLVED' && isAttendanceQuery) {
          const targetDate = new Date().toISOString().split('T')[0]; 
          const user = db.users.find(u => u.id === query.userId);
          
          if (user) {
            const recordIdx = db.attendance.findIndex(a => a.userId === user.id && a.date === targetDate);
            if (recordIdx !== -1) {
              db.attendance[recordIdx].status = 'PRESENT';
            } else {
              db.attendance.push({
                id: Date.now() + 1,
                userId: user.id,
                user: user,
                date: targetDate,
                clockIn: new Date().toISOString(),
                clockOut: null,
                status: 'PRESENT'
              });
            }
            console.log(`[Helpdesk Action] Automatically corrected attendance record for employee: ${user.username}`);
          }
        }

        saveDb();
        console.log(`[Helpdesk Action] Query ID ${id} set to ${status} by admin.`);
        sendJSON(res, 200, query);
      } catch (e) {
        sendJSON(res, 400, { message: 'Error updating query' });
      }
    });
    return;
  }

  // 5. Attendance Queries
  if (url.pathname === '/api/attendance/list' && req.method === 'GET') {
    const requester = getRequesterRole(req);
    if (requester.isAdmin) {
      sendJSON(res, 200, db.attendance);
    } else {
      const records = db.attendance.filter(a => a.userId === requester.userId);
      sendJSON(res, 200, records);
    }
    return;
  }

  if (url.pathname === '/api/attendance/analytics' && req.method === 'GET') {
    const today = new Date().toISOString().split('T')[0];
    const totalUsers = db.users.filter(u => u.status === 'ACTIVE').length;
    const checkedInToday = db.attendance.filter(a => a.date === today).length;
    const latesToday = db.attendance.filter(a => a.date === today && a.status === 'LATE').length;
    
    sendJSON(res, 200, {
      totalActiveUsers: totalUsers,
      present: Math.max(0, checkedInToday - latesToday),
      late: latesToday,
      earlyDepart: 0,
      absent: Math.max(0, totalUsers - checkedInToday),
      totalCheckedIn: checkedInToday,
      attendanceRate: totalUsers > 0 ? (checkedInToday / totalUsers) * 100 : 0
    });
    return;
  }

  // 6. Dashboard Stats (Admin Only)
  if (url.pathname === '/api/dashboard/stats' && req.method === 'GET') {
    const today = new Date().toISOString().split('T')[0];
    const totalUsers = db.users.length;
    const activeUsers = db.users.filter(u => u.status === 'ACTIVE').length;
    const todayCheckedIn = db.attendance.filter(a => a.date === today).length;
    const todayLate = db.attendance.filter(a => a.date === today && a.status === 'LATE').length;

    const mappedLogs = db.attendance.slice(-10).map(a => ({
      id: a.id,
      matchedUserId: a.userId,
      matchedUserFullName: a.user.firstName + " " + a.user.lastName,
      matchedUsername: a.user.username,
      confidence: 98.5,
      snapshotPath: '',
      status: 'SUCCESS',
      deviceInfo: 'Kiosk Camera 01',
      scanTime: a.clockIn
    }));

    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = db.attendance.filter(a => a.date === dateStr).length;
      const label = dateStr.substring(5);
      trendMap[label] = count;
    }

    sendJSON(res, 200, {
      totalUsers,
      activeUsers,
      todayAttendanceCount: todayCheckedIn,
      todayLateCount: todayLate,
      todayScansCount: todayCheckedIn + 1,
      todayAccuracyRate: 98.4,
      recentLogs: mappedLogs.reverse(),
      attendanceTrend: trendMap,
      scanTypeCounts: {
        'SUCCESS': todayCheckedIn,
        'UNKNOWN': 1,
        'FAILURE': 0
      }
    });
    return;
  }

  // NEW: 7. Dashboard Stats for specific Employee (Employee Only)
  if (url.pathname === '/api/dashboard/employee-stats' && req.method === 'GET') {
    const requester = getRequesterRole(req);
    const userId = url.searchParams.get('userId') ? parseInt(url.searchParams.get('userId')) : requester.userId;
    
    if (!userId) {
      sendJSON(res, 401, { message: 'Unauthorized session' });
      return;
    }

    // Filter personal records
    const myAttendance = db.attendance.filter(a => a.userId === userId);
    const myQueries = db.queries.filter(q => q.userId === userId);
    
    const presentCount = myAttendance.filter(a => a.status === 'PRESENT').length;
    const lateCount = myAttendance.filter(a => a.status === 'LATE').length;
    const pendingQueries = myQueries.filter(q => q.status === 'PENDING').length;

    // Calculate a simulated attendance rate (e.g. out of last 10 work days)
    const rate = myAttendance.length > 0 ? ((presentCount + lateCount) / Math.max(1, myAttendance.length)) * 100 : 0;
    
    // Map recent personal scans
    const recentScans = myAttendance.slice(-5).map(a => ({
      id: a.id,
      date: a.date,
      clockIn: a.clockIn,
      clockOut: a.clockOut,
      status: a.status
    })).reverse();

    // Map personal trend (last 7 calendar days check-in times)
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasCheckedIn = db.attendance.some(a => a.userId === userId && a.date === dateStr);
      trendMap[dateStr.substring(5)] = hasCheckedIn ? 1 : 0; // 1 means present/worked, 0 means off
    }

    sendJSON(res, 200, {
      presentCount,
      lateCount,
      pendingQueries,
      attendanceRate: Math.round(rate * 10) / 10,
      recentScans,
      attendanceTrend: trendMap
    });
    return;
  }

  // 8. Download attachment reports
  if (url.pathname.startsWith('/api/reports/')) {
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename=biometric_export.xlsx'
    });
    res.end('Export payload containing list registers.');
    return;
  }

  sendJSON(res, 404, { message: 'Mock route not resolved' });
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`Mock Backend API is listening on port ${PORT}`);
  console.log(`Persistent File Database: ${DB_FILE}`);
  console.log(`===================================================`);
});
