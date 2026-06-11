import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Activity,
  RefreshCw,
  Clock,
  Camera
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch system metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll stats every 10 seconds for real-time dashboards
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>Loading analytics engine...</div>
      </div>
    );
  }

  // Pre-load default configurations if call fails
  const currentStats = stats || {
    totalUsers: 0,
    activeUsers: 0,
    todayAttendanceCount: 0,
    todayLateCount: 0,
    todayScansCount: 0,
    todayAccuracyRate: 100.0,
    recentLogs: [],
    attendanceTrend: {},
    scanTypeCounts: {}
  };

  // Line Chart Config for Attendance Trend
  const trendLabels = Object.keys(currentStats.attendanceTrend);
  const trendValues = Object.values(currentStats.attendanceTrend);
  
  const lineChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Daily Attendance',
        data: trendValues,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  };

  // Doughnut Chart Config for Scan types
  const doughnutData = {
    labels: ['Success Match', 'Unknown Face', 'Scan Failures'],
    datasets: [
      {
        data: [
          currentStats.scanTypeCounts['SUCCESS'] || 0,
          currentStats.scanTypeCounts['UNKNOWN'] || 0,
          currentStats.scanTypeCounts['FAILURE'] || 0
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12 } }
    },
    cutout: '70%'
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>System Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Real-time face recognition and attendance tracking analysis</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchStats} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Sync Data</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--danger-glow)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* 4 Card Matrix */}
      <div className="grid-cols-4">
        {/* Total Users */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '14px', borderRadius: '12px' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>Total Users</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{currentStats.totalUsers}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'block', marginTop: '2px' }}>{currentStats.activeUsers} Active Profiles</span>
          </div>
        </div>

        {/* Today Attendance */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '14px', borderRadius: '12px' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>Today's Clock-ins</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{currentStats.todayAttendanceCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'block', marginTop: '2px' }}>{currentStats.todayLateCount} Late arrivals</span>
          </div>
        </div>

        {/* Today Scans */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '14px', borderRadius: '12px' }}>
            <Camera size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>Today's Scans</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{currentStats.todayScansCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Total scan triggers</span>
          </div>
        </div>

        {/* Accuracy Rate */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '14px', borderRadius: '12px' }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>Match Rate</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{currentStats.todayAccuracyRate}%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'block', marginTop: '2px' }}>Biometric target &gt;95%</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid-cols-2">
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Attendance History Trend</h3>
          <div style={{ height: '260px' }}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', width: '100%' }}>Biometric Scans Breakdown</h3>
          <div style={{ height: '220px', position: 'relative' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div style={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, display: 'block' }}>{currentStats.todayScansCount}</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Scans</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Clock size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Recent Face Recognition Logs</h3>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Scanned Profile</th>
                <th>Confidence</th>
                <th>Detection Device</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentStats.recentLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    No recognition logs captured today.
                  </td>
                </tr>
              ) : (
                currentStats.recentLogs.map((log) => {
                  const date = new Date(log.scanTime);
                  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{formattedTime}</td>
                      <td>
                        {log.status === 'SUCCESS' ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{log.matchedUserFullName}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{log.matchedUsername}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', italic: 'true' }}>Unknown Identity</span>
                        )}
                      </td>
                      <td>{log.confidence > 0 ? `${log.confidence}%` : 'N/A'}</td>
                      <td>{log.deviceInfo || 'Default Kiosk Camera'}</td>
                      <td>
                        <span className={`badge ${
                          log.status === 'SUCCESS' ? 'badge-success' :
                          log.status === 'UNKNOWN' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
