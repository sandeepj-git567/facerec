package com.facesecureai.service.report;

import java.time.LocalDate;

public interface ReportService {
    byte[] generateAttendancePdfReport(LocalDate start, LocalDate end);
    byte[] generateAttendanceExcelReport(LocalDate start, LocalDate end);
    byte[] generateUserPdfReport();
    byte[] generateUserExcelReport();
}
