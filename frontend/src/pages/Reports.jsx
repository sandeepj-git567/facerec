import React, { useState } from 'react';
import axios from 'axios';
import { FileText, FileSpreadsheet, Download, Calendar, Info } from 'lucide-react';

const Reports = () => {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const triggerDownload = async (endpoint, defaultFileName) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(endpoint, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', defaultFileName);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Failed to compile and download report file. Check server connections.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAttendancePdf = () => {
    const fileName = `Attendance_Report_${startDate}_to_${endDate}.pdf`;
    triggerDownload(`/api/reports/attendance/pdf?startDate=${startDate}&endDate=${endDate}`, fileName);
  };

  const handleExportAttendanceExcel = () => {
    const fileName = `Attendance_Report_${startDate}_to_${endDate}.xlsx`;
    triggerDownload(`/api/reports/attendance/excel?startDate=${startDate}&endDate=${endDate}`, fileName);
  };

  const handleExportUsersPdf = () => {
    triggerDownload('/api/reports/users/pdf', 'Employee_Directory_Report.pdf');
  };

  const handleExportUsersExcel = () => {
    triggerDownload('/api/reports/users/excel', 'Employee_Directory_Report.xlsx');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>System Reports</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Compile and export compliance attendance logs and user directories</p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--danger-glow)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Grid container */}
      <div className="grid-cols-2">
        
        {/* Module 1: Attendance Report Card */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '10px', borderRadius: '10px' }}>
              <FileText size={20} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Attendance Log Exporter</h3>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Export attendance files for selected range. Formats include high-fidelity tabular PDF with status highlights and editable Excel sheets.
          </p>

          <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} />
                <span>End Date</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleExportAttendancePdf} disabled={loading}>
              <Download size={16} />
              <span>Export PDF</span>
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleExportAttendanceExcel} disabled={loading}>
              <FileSpreadsheet size={16} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Module 2: User Directory Exporter */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '10px', borderRadius: '10px' }}>
                <FileSpreadsheet size={20} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>User Directory Exporter</h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Export a complete inventory of registered employees containing system profiles, active biometric enrollment markers, and contact attributes.
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              backgroundColor: 'var(--bg-input)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                Biometric face embeddings themselves are protected for security compliance and are not outputted in general administration reports.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleExportUsersPdf} disabled={loading}>
              <Download size={16} />
              <span>Export PDF</span>
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleExportUsersExcel} disabled={loading}>
              <FileSpreadsheet size={16} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Reports;
