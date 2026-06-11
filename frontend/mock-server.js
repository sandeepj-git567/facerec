const http = require('http');

const PORT = 8080;

// Seed Mock Data
const mockUser = {
  id: 1,
  username: 'admin',
  email: 'admin@facesecureai.com',
  firstName: 'System',
  lastName: 'Administrator',
  phone: '+1 555-0100',
  status: 'ACTIVE',
  roles: ['ROLE_ADMIN']
};

const mockUsersList = [
  { id: 1, username: 'admin', email: 'admin@facesecureai.com', firstName: 'System', lastName: 'Administrator', phone: '+1 555-0100', status: 'ACTIVE', roles: ['ROLE_ADMIN'] },
  { id: 2, username: 'johndoe', email: 'john@example.com', firstName: 'John', lastName: 'Doe', phone: '+1 555-0122', status: 'ACTIVE', roles: ['ROLE_USER'] },
  { id: 3, username: 'janesmith', email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith', phone: '+1 555-0144', status: 'ACTIVE', roles: ['ROLE_USER'] }
];

const mockAttendanceRecords = [
  { id: 101, user: mockUsersList[0], date: new Date().toISOString().split('T')[0], clockIn: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), clockOut: null, status: 'PRESENT' },
  { id: 102, user: mockUsersList[1], date: new Date().toISOString().split('T')[0], clockIn: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), clockOut: null, status: 'LATE' },
  { id: 103, user: mockUsersList[2], date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], clockIn: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), clockOut: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), status: 'PRESENT' }
];

const mockRecentLogs = [
  { id: 501, matchedUserId: 1, matchedUserFullName: 'System Administrator', matchedUsername: 'admin', confidence: 99.1, snapshotPath: 'mock_snap_1.jpg', status: 'SUCCESS', deviceInfo: 'Kiosk Camera 01', scanTime: new Date().toISOString() },
  { id: 502, matchedUserId: 2, matchedUserFullName: 'John Doe', matchedUsername: 'johndoe', confidence: 88.5, snapshotPath: 'mock_snap_2.jpg', status: 'SUCCESS', deviceInfo: 'Kiosk Camera 01', scanTime: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 503, matchedUserId: null, matchedUserFullName: 'Unknown Face', matchedUsername: 'unknown', confidence: 42.1, snapshotPath: 'mock_snap_3.jpg', status: 'UNKNOWN', deviceInfo: 'Kiosk Camera 01', scanTime: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
];

// Helper to write JSON responses
const sendJSON = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

const server = http.createServer((req, res) => {
  // Set CORS headers
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

  // 1. Auth Endpoint
  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        // Any password works for local UI testing
        sendJSON(res, 200, {
          token: 'mock-jwt-token-signature-value',
          username: parsed.username || 'admin',
          roles: parsed.username === 'admin' ? ['ROLE_ADMIN'] : ['ROLE_USER']
        });
      } catch (e) {
        sendJSON(res, 400, { message: 'Invalid payload' });
      }
    });
    return;
  }

  if (url.pathname === '/api/auth/me' && req.method === 'GET') {
    sendJSON(res, 200, mockUser);
    return;
  }

  // 2. User CRUD
  if (url.pathname === '/api/users' && req.method === 'GET') {
    sendJSON(res, 200, mockUsersList);
    return;
  }

  if (url.pathname === '/api/users' && req.method === 'POST') {
    sendJSON(res, 201, { id: Date.now(), username: 'new_user', email: 'new@example.com', firstName: 'New', lastName: 'User', status: 'ACTIVE', roles: ['ROLE_USER'] });
    return;
  }

  if (url.pathname.startsWith('/api/users/') && req.method === 'PUT') {
    sendJSON(res, 200, { id: 1, username: 'admin', email: 'admin@facesecureai.com', firstName: 'Modified', lastName: 'User', status: 'ACTIVE', roles: ['ROLE_ADMIN'] });
    return;
  }

  if (url.pathname.startsWith('/api/users/') && req.method === 'DELETE') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 3. Biometrics Endpoints
  if (url.pathname === '/api/faces/enroll' && req.method === 'POST') {
    sendJSON(res, 200, { success: true, message: 'Mock facial biometrics registered!' });
    return;
  }

  if (url.pathname === '/api/faces/recognize' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      // Simulate random matching profiles for the kiosk camera feed
      const isMatch = Math.random() > 0.3;
      if (isMatch) {
        sendJSON(res, 200, {
          matched: true,
          confidence: Math.round((85 + Math.random() * 14) * 100) / 100,
          userId: 2,
          username: 'johndoe',
          fullName: 'John Doe',
          status: 'SUCCESS',
          message: 'Face matched successfully! Attendance marked: CLOCKED_IN'
        });
      } else {
        sendJSON(res, 200, {
          matched: false,
          confidence: Math.round((25 + Math.random() * 20) * 100) / 100,
          status: 'UNKNOWN',
          message: 'Unknown face scanned'
        });
      }
    });
    return;
  }

  // 4. Attendance
  if (url.pathname === '/api/attendance/list' && req.method === 'GET') {
    sendJSON(res, 200, mockAttendanceRecords);
    return;
  }

  if (url.pathname === '/api/attendance/analytics' && req.method === 'GET') {
    sendJSON(res, 200, {
      totalActiveUsers: 3,
      present: 2,
      late: 1,
      earlyDepart: 0,
      absent: 0,
      totalCheckedIn: 3,
      attendanceRate: 100
    });
    return;
  }

  // 5. Dashboard
  if (url.pathname === '/api/dashboard/stats' && req.method === 'GET') {
    sendJSON(res, 200, {
      totalUsers: 3,
      activeUsers: 3,
      todayAttendanceCount: 3,
      todayLateCount: 1,
      todayScansCount: 12,
      todayAccuracyRate: 95.8,
      recentLogs: mockRecentLogs,
      attendanceTrend: {
        '06-05': 1,
        '06-06': 2,
        '06-07': 2,
        '06-08': 3,
        '06-09': 3,
        '06-10': 3,
        '06-11': 3
      },
      scanTypeCounts: {
        'SUCCESS': 10,
        'UNKNOWN': 2,
        'FAILURE': 0
      }
    });
    return;
  }

  // 6. Reports (returns dummy PDF/Excel bytes)
  if (url.pathname.startsWith('/api/reports/')) {
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename=mock_report.txt'
    });
    res.end('Mock Report Data Payload. Please run backend server for real OpenPDF and Apache POI reports.');
    return;
  }

  // Fallback 404
  sendJSON(res, 404, { message: 'Mock endpoint not found' });
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`Mock Backend API is listening on port ${PORT}`);
  console.log(`All CORS origins allowed. Direct requests accepted.`);
  console.log(`===================================================`);
});
