package in.iso20022academy.transform.service;

import com.prowidesoftware.swift.model.SwiftBlock4;
import com.prowidesoftware.swift.model.SwiftMessage;
import com.prowidesoftware.swift.model.mt.mt1xx.MT103;
import in.iso20022academy.transform.dto.TransformResponse;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * MT103 &lt;-&gt; pacs.008 transformation.
 *
 * MT parsing uses Prowide Core (stable block/tag API). The MX (pacs.008) is
 * produced/consumed as XML here — the field mapping is explicit and auditable,
 * so no commercial translator is needed. Extend the mapping (or add pw-iso20022
 * models) for more fields / more message pairs.
 */
@Service
public class TransformService {

    public TransformResponse transform(String source, String direction) {
        String dir = (direction == null || direction.isBlank()) ? "AUTO" : direction.trim().toUpperCase();
        boolean isXml = source.trim().startsWith("<");
        if ("AUTO".equals(dir)) dir = isXml ? "MX_TO_MT" : "MT_TO_MX";

        switch (dir) {
            case "MT_TO_MX":
                if (isXml) throw new IllegalArgumentException("Direction MT_TO_MX but the source looks like XML.");
                return TransformResponse.ok(mt103ToPacs008(source), "MT103", "pacs.008");
            case "MX_TO_MT":
                if (!isXml) throw new IllegalArgumentException("Direction MX_TO_MT but the source is not XML.");
                return TransformResponse.ok(pacs008ToMt103(source), "pacs.008", "MT103");
            default:
                throw new IllegalArgumentException("Unknown direction: " + direction);
        }
    }

    // ---------------------------------------------------------------- MT -> MX
    private String mt103ToPacs008(String mtText) {
        final MT103 mt;
        try {
            String fin = mtText.trim();
            // Learners paste bare block-4 field lines (":20:...:71A:..."). Prowide
            // needs a full FIN message, so wrap bare input in a minimal envelope.
            if (!fin.startsWith("{")) {
                fin = "{1:F01AAAAAAAAXXXX0000000000}{2:I103BBBBBBBBXXXXN}{4:\n" + fin + "\n-}";
            }
            mt = MT103.parse(fin);
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not parse as MT103: " + e.getMessage());
        }
        if (mt == null) throw new IllegalArgumentException("Could not parse as MT103 (unrecognised message).");
        SwiftMessage sm = mt.getSwiftMessage();
        SwiftBlock4 b4 = (sm != null) ? sm.getBlock4() : null;
        if (b4 == null) throw new IllegalArgumentException("MT103 has no text block (block 4).");

        String ref   = nz(b4.getTagValue("20"), "NOTPROVIDED");
        String f32a  = nz(firstTag(b4, "32A"), "");
        String date  = f32a.length() >= 6 ? f32a.substring(0, 6) : "";
        String ccy   = f32a.length() >= 9 ? f32a.substring(6, 9) : "XXX";
        String amt   = f32a.length() > 9 ? f32a.substring(9).replace(",", ".") : "0";
        String dbtr  = partyName(firstTag(b4, "50K", "50F", "50A"));
        String cdtr  = partyName(firstTag(b4, "59", "59A", "59F"));
        String dbtrAgt = bic(firstTag(b4, "52A"));
        String cdtrAgt = bic(firstTag(b4, "57A"));
        String remit = nz(firstTag(b4, "70"), "").replace("\n", " ").trim();
        String chrgBr = chargesToIso(firstTag(b4, "71A"));

        String isoDate = date.length() == 6 ? "20" + date.substring(0, 2) + "-" + date.substring(2, 4) + "-" + date.substring(4, 6) : "";
        String uetr = UUID.randomUUID().toString();
        String created = OffsetDateTime.now().truncatedTo(ChronoUnit.SECONDS).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        StringBuilder x = new StringBuilder();
        x.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        x.append("<Document xmlns=\"urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08\">\n");
        x.append("  <FIToFICstmrCdtTrf>\n");
        x.append("    <GrpHdr>\n");
        x.append("      <MsgId>").append(esc(ref)).append("</MsgId>\n");
        x.append("      <CreDtTm>").append(esc(created)).append("</CreDtTm>\n");
        x.append("      <NbOfTxs>1</NbOfTxs>\n");
        x.append("      <SttlmInf><SttlmMtd>INDA</SttlmMtd></SttlmInf>\n");
        x.append("    </GrpHdr>\n");
        x.append("    <CdtTrfTxInf>\n");
        x.append("      <PmtId><InstrId>").append(esc(ref)).append("</InstrId>")
                .append("<EndToEndId>").append(esc(ref)).append("</EndToEndId>")
                .append("<UETR>").append(uetr).append("</UETR></PmtId>\n");
        x.append("      <IntrBkSttlmAmt Ccy=\"").append(esc(ccy)).append("\">").append(esc(amt)).append("</IntrBkSttlmAmt>\n");
        if (!isoDate.isEmpty()) x.append("      <IntrBkSttlmDt>").append(isoDate).append("</IntrBkSttlmDt>\n");
        x.append("      <ChrgBr>").append(esc(chrgBr)).append("</ChrgBr>\n");
        if (!dbtrAgt.isEmpty()) x.append("      <InstgAgt><FinInstnId><BICFI>").append(esc(dbtrAgt)).append("</BICFI></FinInstnId></InstgAgt>\n");
        x.append("      <Dbtr><Nm>").append(esc(dbtr)).append("</Nm></Dbtr>\n");
        if (!dbtrAgt.isEmpty()) x.append("      <DbtrAgt><FinInstnId><BICFI>").append(esc(dbtrAgt)).append("</BICFI></FinInstnId></DbtrAgt>\n");
        if (!cdtrAgt.isEmpty()) x.append("      <CdtrAgt><FinInstnId><BICFI>").append(esc(cdtrAgt)).append("</BICFI></FinInstnId></CdtrAgt>\n");
        x.append("      <Cdtr><Nm>").append(esc(cdtr)).append("</Nm></Cdtr>\n");
        if (!remit.isEmpty()) x.append("      <RmtInf><Ustrd>").append(esc(remit)).append("</Ustrd></RmtInf>\n");
        x.append("    </CdtTrfTxInf>\n");
        x.append("  </FIToFICstmrCdtTrf>\n");
        x.append("</Document>\n");
        return x.toString();
    }

    // ---------------------------------------------------------------- MX -> MT
    private String pacs008ToMt103(String xml) {
        final Document doc;
        try {
            DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
            f.setNamespaceAware(true);
            doc = f.newDocumentBuilder().parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not parse pacs.008 XML: " + e.getMessage());
        }
        String ref    = text(doc, "EndToEndId");
        if (ref.isEmpty()) ref = text(doc, "MsgId");
        String ccy    = attr(doc, "IntrBkSttlmAmt", "Ccy");
        String amt    = text(doc, "IntrBkSttlmAmt");
        String dt     = text(doc, "IntrBkSttlmDt");            // yyyy-MM-dd
        String dbtr   = firstText(doc, "Dbtr", "Nm");
        String cdtr   = firstText(doc, "Cdtr", "Nm");
        String dbtrAgt = firstText(doc, "DbtrAgt", "BICFI");
        String cdtrAgt = firstText(doc, "CdtrAgt", "BICFI");
        String remit  = text(doc, "Ustrd");
        String chrgBr = isoToCharges(text(doc, "ChrgBr"));

        String yymmdd = (dt.length() == 10) ? dt.substring(2, 4) + dt.substring(5, 7) + dt.substring(8, 10) : "";
        String amtMt = amt.replace(".", ",");

        StringBuilder m = new StringBuilder();
        m.append(":20:").append(cut(ref, 16)).append('\n');
        m.append(":23B:CRED").append('\n');
        m.append(":32A:").append(yymmdd).append(ccy).append(amtMt).append('\n');
        if (!dbtr.isEmpty()) m.append(":50K:").append(dbtr).append('\n');
        if (!dbtrAgt.isEmpty()) m.append(":52A:").append(dbtrAgt).append('\n');
        if (!cdtrAgt.isEmpty()) m.append(":57A:").append(cdtrAgt).append('\n');
        if (!cdtr.isEmpty()) m.append(":59:").append(cdtr).append('\n');
        if (!remit.isEmpty()) m.append(":70:").append(cut(remit, 140)).append('\n');
        m.append(":71A:").append(chrgBr).append('\n');
        return m.toString();
    }

    // -------------------------------------------------------------- helpers
    private static String firstTag(SwiftBlock4 b4, String... names) {
        for (String n : names) {
            String v = b4.getTagValue(n);
            if (v != null && !v.isBlank()) return v;
        }
        return "";
    }
    /** Best-effort party name from an MT 50/59 field value (name = first non-account line). */
    private static String partyName(String field) {
        if (field == null || field.isBlank()) return "";
        for (String line : field.split("\\r?\\n")) {
            String t = line.trim();
            if (t.isEmpty() || t.startsWith("/")) continue; // skip account line(s)
            return t;
        }
        return field.trim();
    }
    private static String bic(String field) {
        if (field == null || field.isBlank()) return "";
        for (String line : field.split("\\r?\\n")) {
            String t = line.trim();
            if (!t.isEmpty() && !t.startsWith("/")) return t; // the BIC line
        }
        return "";
    }
    private static String chargesToIso(String f71a) {
        if (f71a == null) return "SHAR";
        String v = f71a.trim().toUpperCase();
        return switch (v) { case "OUR" -> "DEBT"; case "BEN" -> "CRED"; default -> "SHAR"; };
    }
    private static String isoToCharges(String chrgBr) {
        if (chrgBr == null) return "SHA";
        return switch (chrgBr.trim().toUpperCase()) { case "DEBT" -> "OUR"; case "CRED" -> "BEN"; default -> "SHA"; };
    }

    // XML: namespace-agnostic reads by local name
    private static String text(Document doc, String localName) {
        Element el = firstEl(doc.getDocumentElement(), localName);
        return el == null ? "" : el.getTextContent().trim();
    }
    private static String attr(Document doc, String localName, String attrName) {
        Element el = firstEl(doc.getDocumentElement(), localName);
        return el == null ? "" : el.getAttribute(attrName);
    }
    /** Text of `child` local name inside the first `parent` local name (e.g. Dbtr/Nm). */
    private static String firstText(Document doc, String parent, String child) {
        Element p = firstEl(doc.getDocumentElement(), parent);
        if (p == null) return "";
        Element c = firstEl(p, child);
        return c == null ? "" : c.getTextContent().trim();
    }
    private static Element firstEl(Node root, String localName) {
        if (root == null) return null;
        NodeList kids = root.getChildNodes();
        for (int i = 0; i < kids.getLength(); i++) {
            Node n = kids.item(i);
            if (n.getNodeType() == Node.ELEMENT_NODE) {
                if (localName.equals(n.getLocalName()) || localName.equals(n.getNodeName())) return (Element) n;
                Element deep = firstEl(n, localName);
                if (deep != null) return deep;
            }
        }
        return null;
    }

    private static String nz(String s, String dflt) { return (s == null || s.isBlank()) ? dflt : s; }
    private static String cut(String s, int max) { return s.length() <= max ? s : s.substring(0, max); }
    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
