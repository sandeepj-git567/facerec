package com.facesecureai.service.report;

import com.lowagie.text.Font;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.facesecureai.model.AttendanceRecord;
import com.facesecureai.model.User;
import com.facesecureai.repository.AttendanceRecordRepository;
import com.facesecureai.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional(readOnly = true)
@Slf4j
public class ReportServiceImpl implements ReportService {

    @Autowired
    private AttendanceRecordRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public byte[] generateAttendancePdfReport(LocalDate start, LocalDate end) {
        List<AttendanceRecord> records = attendanceRepository.findByDateBetween(start, end);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        Document document = new Document(PageSize.A4);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Document Header Styling
            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(15, 23, 42)); // Slate Color
            Paragraph title = new Paragraph("FaceSecureAI - Attendance Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);

            Font subFont = new Font(Font.HELVETICA, 10, Font.ITALIC, Color.GRAY);
            Paragraph dateRange = new Paragraph("Reporting Period: " + start.format(DATE_FORMATTER) + " to " + end.format(DATE_FORMATTER), subFont);
            dateRange.setAlignment(Element.ALIGN_CENTER);
            dateRange.setSpacingAfter(20);
            document.add(dateRange);

            // Table Creation
            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100f);
            table.setWidths(new float[]{1.0f, 2.0f, 1.8f, 1.5f, 2.2f, 2.2f, 1.5f});

            // Table Header Styles
            Font headerFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
            Color headerBg = new Color(30, 41, 59); // Dark Slate

            String[] headers = {"ID", "Name", "Username", "Date", "Clock In", "Clock Out", "Status"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Paragraph(header, headerFont));
                cell.setBackgroundColor(headerBg);
                cell.setPadding(8);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            // Populate Row Data
            Font rowFont = new Font(Font.HELVETICA, 9, Font.NORMAL);
            for (AttendanceRecord record : records) {
                table.addCell(createCell(String.valueOf(record.getId()), rowFont, Element.ALIGN_CENTER));
                table.addCell(createCell(record.getUser().getFullName(), rowFont, Element.ALIGN_LEFT));
                table.addCell(createCell(record.getUser().getUsername(), rowFont, Element.ALIGN_LEFT));
                table.addCell(createCell(record.getDate().format(DATE_FORMATTER), rowFont, Element.ALIGN_CENTER));
                table.addCell(createCell(record.getClockIn().format(TIME_FORMATTER), rowFont, Element.ALIGN_CENTER));
                table.addCell(createCell(record.getClockOut() != null ? record.getClockOut().format(TIME_FORMATTER) : "N/A", rowFont, Element.ALIGN_CENTER));
                
                // Status Cell Color Coding
                PdfPCell statusCell = new PdfPCell(new Paragraph(record.getStatus(), rowFont));
                statusCell.setPadding(6);
                statusCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                if ("PRESENT".equals(record.getStatus())) {
                    statusCell.setBackgroundColor(new Color(220, 252, 231)); // light green
                } else if ("LATE".equals(record.getStatus())) {
                    statusCell.setBackgroundColor(new Color(254, 243, 199)); // light amber
                } else {
                    statusCell.setBackgroundColor(new Color(254, 226, 226)); // light red
                }
                table.addCell(statusCell);
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            log.error("Error generating attendance PDF: {}", e.getMessage(), e);
        }

        return out.toByteArray();
    }

    @Override
    public byte[] generateAttendanceExcelReport(LocalDate start, LocalDate end) {
        List<AttendanceRecord> records = attendanceRepository.findByDateBetween(start, end);

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Attendance Summary");

            // Header Style
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(org.apache.poi.ss.usermodel.IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);

            // Create Headers
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Record ID", "Username", "Full Name", "Email", "Date", "Clock In", "Clock Out", "Status"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Populate rows
            int rowIdx = 1;
            for (AttendanceRecord record : records) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(record.getId());
                row.createCell(1).setCellValue(record.getUser().getUsername());
                row.createCell(2).setCellValue(record.getUser().getFullName());
                row.createCell(3).setCellValue(record.getUser().getEmail());
                row.createCell(4).setCellValue(record.getDate().format(DATE_FORMATTER));
                row.createCell(5).setCellValue(record.getClockIn().format(TIME_FORMATTER));
                row.createCell(6).setCellValue(record.getClockOut() != null ? record.getClockOut().format(TIME_FORMATTER) : "N/A");
                row.createCell(7).setCellValue(record.getStatus());
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Excel generation error: {}", e.getMessage());
            return new byte[0];
        }
    }

    @Override
    public byte[] generateUserPdfReport() {
        List<User> users = userRepository.findAll();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        Document document = new Document(PageSize.A4);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(15, 23, 42));
            Paragraph title = new Paragraph("FaceSecureAI - Registered Users Directory", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100f);
            table.setWidths(new float[]{1.0f, 1.8f, 2.2f, 2.5f, 1.5f, 1.5f});

            Font headerFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
            Color headerBg = new Color(30, 41, 59);

            String[] headers = {"User ID", "Username", "Full Name", "Email", "Phone", "Status"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Paragraph(header, headerFont));
                cell.setBackgroundColor(headerBg);
                cell.setPadding(8);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            Font rowFont = new Font(Font.HELVETICA, 9, Font.NORMAL);
            for (User user : users) {
                table.addCell(createCell(String.valueOf(user.getId()), rowFont, Element.ALIGN_CENTER));
                table.addCell(createCell(user.getUsername(), rowFont, Element.ALIGN_LEFT));
                table.addCell(createCell(user.getFullName(), rowFont, Element.ALIGN_LEFT));
                table.addCell(createCell(user.getEmail(), rowFont, Element.ALIGN_LEFT));
                table.addCell(createCell(user.getPhone() != null ? user.getPhone() : "N/A", rowFont, Element.ALIGN_CENTER));
                
                PdfPCell statusCell = new PdfPCell(new Paragraph(user.getStatus(), rowFont));
                statusCell.setPadding(6);
                statusCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                if ("ACTIVE".equals(user.getStatus())) {
                    statusCell.setBackgroundColor(new Color(220, 252, 231));
                } else {
                    statusCell.setBackgroundColor(new Color(254, 226, 226));
                }
                table.addCell(statusCell);
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            log.error("PDF User directory error: {}", e.getMessage());
        }

        return out.toByteArray();
    }

    @Override
    public byte[] generateUserExcelReport() {
        List<User> users = userRepository.findAll();

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Users Database");

            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(org.apache.poi.ss.usermodel.IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"User ID", "Username", "First Name", "Last Name", "Email", "Phone", "Status", "Registered Date"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (User user : users) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(user.getId());
                row.createCell(1).setCellValue(user.getUsername());
                row.createCell(2).setCellValue(user.getFirstName());
                row.createCell(3).setCellValue(user.getLastName());
                row.createCell(4).setCellValue(user.getEmail());
                row.createCell(5).setCellValue(user.getPhone() != null ? user.getPhone() : "N/A");
                row.createCell(6).setCellValue(user.getStatus());
                row.createCell(7).setCellValue(user.getCreatedAt().format(DATE_FORMATTER));
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Excel User list error: {}", e.getMessage());
            return new byte[0];
        }
    }

    private PdfPCell createCell(String value, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Paragraph(value, font));
        cell.setPadding(6);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }
}
