import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Percent, 
  Camera, 
  MessageSquare, 
  RefreshCw,
  Clock
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const UserDashboard = ({ setCurrentTab }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEmployeeStats = async () => {
    setLoading(true);
    try {
      // Fetch stats filtered specifically for the logged-in user
      const response = await axios.get('/api/dashboard/employee-stats');
      setStats(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch personal attendance metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeStats();
  }, []);

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>Loading employee dashboard...</div>
      </div>
    );
  }

  const currentStats = stats || {
    presentCount: 0,
    lateCount: 0,
    pendingQueries: 0,
    attendanceRate: 0.0,
    recentScans: [],
    attendanceTrend: {}
  };

  // Line Chart Config for Personal Work Trend
  const trendLabels = Object.keys(currentStats.attendanceTrend);
  const trendValues = Object.values(currentStats.attendanceTrend);

  const lineChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Work Days',
        data: trendValues,
        borderColor: '#10b981', // green for employees
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#10b981'
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => context.raw === 1 ? 'Present / Worked' : 'Off / Absent'
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#94a3b8',
          stepSize: 1,
          callback: (value) => value === 1 ? 'WORKED' : value === 0 ? 'OFF' : ''
        },
        min: 0,
        max: 1
      },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Welcome back, {user?.username}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Here is your biometric attendance and query resolution report.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchEmployeeStats} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Stats</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--danger-glow)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* 4 Card Matrix */}
      <div className="grid-cols-4">
        {/* Present Days */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '14px', borderRadius: '12px' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>Days Present</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{currentStats.presentCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Standard shifts</span>
          </div>
        </div>

        {/* Late arrivals */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '14px', borderRadius: '12px' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>Late Arrivals</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{currentStats.lateCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>After 09:00 AM</span>
          </div>
        </div>

        {/* Pending Tickets */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '14px', borderRadius: '12px' }}>
            <HelpCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>Pending Tickets</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{currentStats.pendingQueries}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>In review by Admin</span>
          </div>
        </div>

        {/* Attendance Percentage */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '14px', borderRadius: '12px' }}>
            <Percent size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>Attendance Rate</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{currentStats.attendanceRate}%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Out of logged shifts</span>
          </div>
        </div>
      </div>

      {/* Main Charts & History section */}
      <div className="grid-cols-2" style={{ gridTemplateColumns: '45% 55%' }}>
        {/* Left Side: Personal Worked Trend */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>My Check-in Frequency (Last 7 Days)</h3>
          <div style={{ height: '230px' }}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Right Side: Recent Check-ins table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Clock size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>My Recent Scans</h3>
          </div>

          <div className="table-container">
            <table className="custom-table" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentStats.recentScans.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                      No biometric scans logged.
                    </td>
                  </tr>
                ) : (
                  currentStats.recentScans.map((scan) => {
                    const clockInTime = new Date(scan.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const clockOutTime = scan.clockOut 
                      ? new Date(scan.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'On Shift';

                    return (
                      <tr key={scan.id}>
                        <td style={{ fontWeight: 600 }}>{scan.date}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>{clockInTime}</td>
                        <td style={{ fontWeight: 500 }}>{clockOutTime}</td>
                        <td>
                          <span className={`badge ${
                            scan.status === 'PRESENT' ? 'badge-success' :
                            scan.status === 'LATE' ? 'badge-warning' : 'badge-danger'
                          }`} style={{ fontSize: '0.625rem' }}>
                            {scan.status}
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

      {/* Quick Action Navigation Buttons */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Quick Biometric Clock-in</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>Need to verify or clock your attendance shift now?</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn btn-secondary" onClick={() => setCurrentTab('helpdesk')}>
            <MessageSquare size={16} />
            <span>Submit Query Ticket</span>
          </button>
          <button className="btn btn-primary" onClick={() => setCurrentTab('scan')}>
            <Camera size={16} />
            <span>Go to Recognition Kiosk</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default UserDashboard;
