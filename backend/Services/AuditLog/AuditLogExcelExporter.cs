using System.IO.Compression;
using System.Xml;

namespace backend.Services.AuditLog;

public sealed class AuditLogExcelRow
{
    public DateTime CreatedAt { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string UserEmail { get; init; } = string.Empty;
    public string Action { get; init; } = string.Empty;
    public string EntityName { get; init; } = string.Empty;
    public Guid? EntityId { get; init; }
    public string? IpAddress { get; init; }
    public string? OldValues { get; init; }
    public string? NewValues { get; init; }
}

public static class AuditLogExcelExporter
{
    private const string SpreadsheetNamespace =
        "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
    private const string OfficeDocumentRelationshipsNamespace =
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    private const string PackageRelationshipsNamespace =
        "http://schemas.openxmlformats.org/package/2006/relationships";
    private const string ContentTypesNamespace =
        "http://schemas.openxmlformats.org/package/2006/content-types";
    private const int ExcelCellCharacterLimit = 32767;

    private static readonly string[] Headers =
    [
        "Date",
        "User",
        "Email",
        "Action",
        "Target Entity",
        "Target ID",
        "IP Address",
        "Previous Values",
        "New Values"
    ];

    public static byte[] CreateWorkbook(IReadOnlyCollection<AuditLogExcelRow> logs)
    {
        using var stream = new MemoryStream();

        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            WriteContentTypes(archive);
            WritePackageRelationships(archive);
            WriteWorkbook(archive);
            WriteWorkbookRelationships(archive);
            WriteStyles(archive);
            WriteWorksheet(archive, logs);
        }

        return stream.ToArray();
    }

    private static void WriteContentTypes(ZipArchive archive)
    {
        WriteXmlEntry(archive, "[Content_Types].xml", writer =>
        {
            writer.WriteStartElement("Types", ContentTypesNamespace);
            WriteType(writer, "Default", "Extension", "rels", "ContentType", "application/vnd.openxmlformats-package.relationships+xml");
            WriteType(writer, "Default", "Extension", "xml", "ContentType", "application/xml");
            WriteType(writer, "Override", "PartName", "/xl/workbook.xml", "ContentType", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml");
            WriteType(writer, "Override", "PartName", "/xl/worksheets/sheet1.xml", "ContentType", "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml");
            WriteType(writer, "Override", "PartName", "/xl/styles.xml", "ContentType", "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml");
            writer.WriteEndElement();
        });
    }

    private static void WritePackageRelationships(ZipArchive archive)
    {
        WriteXmlEntry(archive, "_rels/.rels", writer =>
        {
            writer.WriteStartElement("Relationships", PackageRelationshipsNamespace);
            WriteRelationship(
                writer,
                "rId1",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
                "xl/workbook.xml");
            writer.WriteEndElement();
        });
    }

    private static void WriteWorkbook(ZipArchive archive)
    {
        WriteXmlEntry(archive, "xl/workbook.xml", writer =>
        {
            writer.WriteStartElement("workbook", SpreadsheetNamespace);
            writer.WriteAttributeString("xmlns", "r", null, OfficeDocumentRelationshipsNamespace);
            writer.WriteStartElement("sheets", SpreadsheetNamespace);
            writer.WriteStartElement("sheet", SpreadsheetNamespace);
            writer.WriteAttributeString("name", "Audit Logs");
            writer.WriteAttributeString("sheetId", "1");
            writer.WriteAttributeString("r", "id", OfficeDocumentRelationshipsNamespace, "rId1");
            writer.WriteEndElement();
            writer.WriteEndElement();
            writer.WriteEndElement();
        });
    }

    private static void WriteWorkbookRelationships(ZipArchive archive)
    {
        WriteXmlEntry(archive, "xl/_rels/workbook.xml.rels", writer =>
        {
            writer.WriteStartElement("Relationships", PackageRelationshipsNamespace);
            WriteRelationship(
                writer,
                "rId1",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet",
                "worksheets/sheet1.xml");
            WriteRelationship(
                writer,
                "rId2",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles",
                "styles.xml");
            writer.WriteEndElement();
        });
    }

    private static void WriteStyles(ZipArchive archive)
    {
        WriteXmlEntry(archive, "xl/styles.xml", writer =>
        {
            writer.WriteStartElement("styleSheet", SpreadsheetNamespace);

            writer.WriteStartElement("fonts", SpreadsheetNamespace);
            writer.WriteAttributeString("count", "2");
            WriteFont(writer, bold: false, color: null);
            WriteFont(writer, bold: true, color: "FFFFFFFF");
            writer.WriteEndElement();

            writer.WriteStartElement("fills", SpreadsheetNamespace);
            writer.WriteAttributeString("count", "3");
            WritePatternFill(writer, "none", null);
            WritePatternFill(writer, "gray125", null);
            WritePatternFill(writer, "solid", "FF166534");
            writer.WriteEndElement();

            writer.WriteStartElement("borders", SpreadsheetNamespace);
            writer.WriteAttributeString("count", "1");
            writer.WriteStartElement("border", SpreadsheetNamespace);
            writer.WriteElementString("left", SpreadsheetNamespace, string.Empty);
            writer.WriteElementString("right", SpreadsheetNamespace, string.Empty);
            writer.WriteElementString("top", SpreadsheetNamespace, string.Empty);
            writer.WriteElementString("bottom", SpreadsheetNamespace, string.Empty);
            writer.WriteElementString("diagonal", SpreadsheetNamespace, string.Empty);
            writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteStartElement("cellStyleXfs", SpreadsheetNamespace);
            writer.WriteAttributeString("count", "1");
            WriteXf(writer, fontId: 0, fillId: 0, applyHeaderAlignment: false);
            writer.WriteEndElement();

            writer.WriteStartElement("cellXfs", SpreadsheetNamespace);
            writer.WriteAttributeString("count", "2");
            WriteXf(writer, fontId: 0, fillId: 0, applyHeaderAlignment: false);
            WriteXf(writer, fontId: 1, fillId: 2, applyHeaderAlignment: true);
            writer.WriteEndElement();

            writer.WriteStartElement("cellStyles", SpreadsheetNamespace);
            writer.WriteAttributeString("count", "1");
            writer.WriteStartElement("cellStyle", SpreadsheetNamespace);
            writer.WriteAttributeString("name", "Normal");
            writer.WriteAttributeString("xfId", "0");
            writer.WriteAttributeString("builtinId", "0");
            writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteEndElement();
        });
    }

    private static void WriteWorksheet(
        ZipArchive archive,
        IReadOnlyCollection<AuditLogExcelRow> logs)
    {
        WriteXmlEntry(archive, "xl/worksheets/sheet1.xml", writer =>
        {
            writer.WriteStartElement("worksheet", SpreadsheetNamespace);

            writer.WriteStartElement("sheetViews", SpreadsheetNamespace);
            writer.WriteStartElement("sheetView", SpreadsheetNamespace);
            writer.WriteAttributeString("workbookViewId", "0");
            writer.WriteStartElement("pane", SpreadsheetNamespace);
            writer.WriteAttributeString("ySplit", "1");
            writer.WriteAttributeString("topLeftCell", "A2");
            writer.WriteAttributeString("activePane", "bottomLeft");
            writer.WriteAttributeString("state", "frozen");
            writer.WriteEndElement();
            writer.WriteEndElement();
            writer.WriteEndElement();

            WriteColumns(writer);

            writer.WriteStartElement("sheetData", SpreadsheetNamespace);
            WriteRow(writer, 1, Headers, header: true);

            var rowNumber = 2;
            foreach (var log in logs)
            {
                WriteRow(
                    writer,
                    rowNumber,
                    [
                        log.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                        log.UserName,
                        log.UserEmail,
                        log.Action,
                        log.EntityName,
                        log.EntityId?.ToString() ?? string.Empty,
                        log.IpAddress ?? string.Empty,
                        log.OldValues ?? string.Empty,
                        log.NewValues ?? string.Empty
                    ],
                    header: false);
                rowNumber++;
            }

            writer.WriteEndElement();

            writer.WriteStartElement("autoFilter", SpreadsheetNamespace);
            writer.WriteAttributeString("ref", $"A1:I{Math.Max(1, rowNumber - 1)}");
            writer.WriteEndElement();

            writer.WriteStartElement("pageMargins", SpreadsheetNamespace);
            writer.WriteAttributeString("left", "0.7");
            writer.WriteAttributeString("right", "0.7");
            writer.WriteAttributeString("top", "0.75");
            writer.WriteAttributeString("bottom", "0.75");
            writer.WriteAttributeString("header", "0.3");
            writer.WriteAttributeString("footer", "0.3");
            writer.WriteEndElement();

            writer.WriteEndElement();
        });
    }

    private static void WriteColumns(XmlWriter writer)
    {
        double[] widths = [21, 24, 30, 15, 22, 39, 18, 55, 55];

        writer.WriteStartElement("cols", SpreadsheetNamespace);
        for (var index = 0; index < widths.Length; index++)
        {
            writer.WriteStartElement("col", SpreadsheetNamespace);
            writer.WriteAttributeString("min", (index + 1).ToString());
            writer.WriteAttributeString("max", (index + 1).ToString());
            writer.WriteAttributeString("width", widths[index].ToString(System.Globalization.CultureInfo.InvariantCulture));
            writer.WriteAttributeString("customWidth", "1");
            writer.WriteEndElement();
        }
        writer.WriteEndElement();
    }

    private static void WriteRow(
        XmlWriter writer,
        int rowNumber,
        IReadOnlyList<string> values,
        bool header)
    {
        writer.WriteStartElement("row", SpreadsheetNamespace);
        writer.WriteAttributeString("r", rowNumber.ToString());

        for (var index = 0; index < values.Count; index++)
        {
            writer.WriteStartElement("c", SpreadsheetNamespace);
            writer.WriteAttributeString("r", $"{GetColumnName(index + 1)}{rowNumber}");
            writer.WriteAttributeString("t", "inlineStr");
            if (header)
            {
                writer.WriteAttributeString("s", "1");
            }

            writer.WriteStartElement("is", SpreadsheetNamespace);
            writer.WriteStartElement("t", SpreadsheetNamespace);
            writer.WriteAttributeString("xml", "space", "http://www.w3.org/XML/1998/namespace", "preserve");
            writer.WriteString(SanitizeCellValue(values[index]));
            writer.WriteEndElement();
            writer.WriteEndElement();
            writer.WriteEndElement();
        }

        writer.WriteEndElement();
    }

    private static string SanitizeCellValue(string value)
    {
        var sanitized = string.Concat(value.Where(XmlConvert.IsXmlChar));
        return sanitized.Length <= ExcelCellCharacterLimit
            ? sanitized
            : sanitized[..ExcelCellCharacterLimit];
    }

    private static string GetColumnName(int columnNumber)
    {
        var name = string.Empty;
        while (columnNumber > 0)
        {
            columnNumber--;
            name = (char)('A' + columnNumber % 26) + name;
            columnNumber /= 26;
        }

        return name;
    }

    private static void WriteFont(XmlWriter writer, bool bold, string? color)
    {
        writer.WriteStartElement("font", SpreadsheetNamespace);
        if (bold)
        {
            writer.WriteElementString("b", SpreadsheetNamespace, string.Empty);
        }
        if (color is not null)
        {
            writer.WriteStartElement("color", SpreadsheetNamespace);
            writer.WriteAttributeString("rgb", color);
            writer.WriteEndElement();
        }
        writer.WriteStartElement("sz", SpreadsheetNamespace);
        writer.WriteAttributeString("val", "11");
        writer.WriteEndElement();
        writer.WriteStartElement("name", SpreadsheetNamespace);
        writer.WriteAttributeString("val", "Calibri");
        writer.WriteEndElement();
        writer.WriteEndElement();
    }

    private static void WritePatternFill(XmlWriter writer, string patternType, string? color)
    {
        writer.WriteStartElement("fill", SpreadsheetNamespace);
        writer.WriteStartElement("patternFill", SpreadsheetNamespace);
        writer.WriteAttributeString("patternType", patternType);
        if (color is not null)
        {
            writer.WriteStartElement("fgColor", SpreadsheetNamespace);
            writer.WriteAttributeString("rgb", color);
            writer.WriteEndElement();
            writer.WriteStartElement("bgColor", SpreadsheetNamespace);
            writer.WriteAttributeString("indexed", "64");
            writer.WriteEndElement();
        }
        writer.WriteEndElement();
        writer.WriteEndElement();
    }

    private static void WriteXf(
        XmlWriter writer,
        int fontId,
        int fillId,
        bool applyHeaderAlignment)
    {
        writer.WriteStartElement("xf", SpreadsheetNamespace);
        writer.WriteAttributeString("numFmtId", "0");
        writer.WriteAttributeString("fontId", fontId.ToString());
        writer.WriteAttributeString("fillId", fillId.ToString());
        writer.WriteAttributeString("borderId", "0");
        writer.WriteAttributeString("xfId", "0");

        if (applyHeaderAlignment)
        {
            writer.WriteAttributeString("applyFont", "1");
            writer.WriteAttributeString("applyFill", "1");
            writer.WriteAttributeString("applyAlignment", "1");
            writer.WriteStartElement("alignment", SpreadsheetNamespace);
            writer.WriteAttributeString("horizontal", "center");
            writer.WriteAttributeString("vertical", "center");
            writer.WriteEndElement();
        }

        writer.WriteEndElement();
    }

    private static void WriteType(
        XmlWriter writer,
        string elementName,
        string firstAttributeName,
        string firstAttributeValue,
        string secondAttributeName,
        string secondAttributeValue)
    {
        writer.WriteStartElement(elementName, ContentTypesNamespace);
        writer.WriteAttributeString(firstAttributeName, firstAttributeValue);
        writer.WriteAttributeString(secondAttributeName, secondAttributeValue);
        writer.WriteEndElement();
    }

    private static void WriteRelationship(
        XmlWriter writer,
        string id,
        string type,
        string target)
    {
        writer.WriteStartElement("Relationship", PackageRelationshipsNamespace);
        writer.WriteAttributeString("Id", id);
        writer.WriteAttributeString("Type", type);
        writer.WriteAttributeString("Target", target);
        writer.WriteEndElement();
    }

    private static void WriteXmlEntry(
        ZipArchive archive,
        string path,
        Action<XmlWriter> writeContent)
    {
        var entry = archive.CreateEntry(path, CompressionLevel.Fastest);
        using var entryStream = entry.Open();
        using var writer = XmlWriter.Create(entryStream, new XmlWriterSettings
        {
            Encoding = new System.Text.UTF8Encoding(encoderShouldEmitUTF8Identifier: false),
            Indent = false,
            CloseOutput = false
        });

        writer.WriteStartDocument();
        writeContent(writer);
        writer.WriteEndDocument();
    }
}