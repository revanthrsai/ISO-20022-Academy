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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * MT &lt;-&gt; MX transformation across the payment &amp; cash-management set.
 *
 * MT parsing uses Prowide Core (stable block/tag API). The MX side is
 * produced/consumed as XML here — every field mapping is explicit and auditable,
 * so no commercial translator is needed.
 *
 * MX -&gt; MT is dispatched by the detected ISO message type (from the schema
 * namespace):
 *
 *   pacs.008 -&gt; MT103        pacs.004 -&gt; MT103 RETN     pain.001 -&gt; MT101
 *   pain.008 -&gt; MT104        camt.053 -&gt; MT940          camt.054 -&gt; MT900/910
 *   camt.056 -&gt; MT192        pacs.002 -&gt; MT199          pain.002 -&gt; MT199
 *
 * MT -&gt; MX currently covers MT103 -&gt; pacs.008 (the reverse mappings for the
 * other families are the next tranche). Messages with no MT counterpart
 * (securities, cards, FX, trade, headers, network admin) are rejected with a
 * clear message rather than a wrong guess.
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
                return mxToMt(source);
            default:
                throw new IllegalArgumentException("Unknown direction: " + direction);
        }
    }

    // ============================================================ MX -> MT
    private TransformResponse mxToMt(String xml) {
        Document doc = parseXml(xml);
        String type = detectIsoType(xml);
        switch (type) {
            case "pacs.008": return TransformResponse.ok(pacs008ToMt103(doc), "pacs.008", "MT103");
            case "pacs.004": return TransformResponse.ok(pacs004ToMt103Retn(doc), "pacs.004", "MT103 RETN");
            case "pain.001": return TransformResponse.ok(pain001ToMt101(doc), "pain.001", "MT101");
            case "pain.008": return TransformResponse.ok(pain008ToMt104(doc), "pain.008", "MT104");
            case "camt.053": return TransformResponse.ok(camt053ToMt940(doc), "camt.053", "MT940");
            case "camt.054": {
                String[] r = camt054ToMt9x0(doc);
                return TransformResponse.ok(r[0], "camt.054", r[1]);
            }
            case "camt.056": return TransformResponse.ok(camt056ToMt192(doc), "camt.056", "MT192");
            case "pacs.002": return TransformResponse.ok(pacs002ToMt199(doc), "pacs.002", "MT199");
            case "pain.002": return TransformResponse.ok(pain002ToMt199(doc), "pain.002", "MT199");
            default:
                throw new IllegalArgumentException(
                    "No MT equivalent for " + (type.isEmpty() ? "this message" : type)
                    + ". MT ⇄ MX covers the payment & cash-management messages (pacs, pain, camt); "
                    + "securities, cards, FX, trade and header messages have no MT counterpart.");
        }
    }

    // ----------------------------------------------------- pacs.008 -> MT103
    private String pacs008ToMt103(Document doc) {
        String ref     = firstNonEmpty(text(doc, "EndToEndId"), text(doc, "MsgId"));
        String ccy     = attr(doc, "IntrBkSttlmAmt", "Ccy");
        String amt     = text(doc, "IntrBkSttlmAmt");
        String dt      = text(doc, "IntrBkSttlmDt");
        String dbtr    = firstText(doc, "Dbtr", "Nm");
        String cdtr    = firstText(doc, "Cdtr", "Nm");
        String dbtrAgt = firstText(doc, "DbtrAgt", "BICFI");
        String cdtrAgt = firstText(doc, "CdtrAgt", "BICFI");
        String remit   = text(doc, "Ustrd");
        String chrgBr  = isoToCharges(text(doc, "ChrgBr"));

        StringBuilder m = new StringBuilder();
        m.append(":20:").append(cut(ref, 16)).append('\n');
        m.append(":23B:CRED").append('\n');
        m.append(":32A:").append(yymmdd(dt)).append(ccy).append(comma(amt)).append('\n');
        if (!dbtr.isEmpty())    m.append(":50K:").append(dbtr).append('\n');
        if (!dbtrAgt.isEmpty()) m.append(":52A:").append(dbtrAgt).append('\n');
        if (!cdtrAgt.isEmpty()) m.append(":57A:").append(cdtrAgt).append('\n');
        if (!cdtr.isEmpty())    m.append(":59:").append(cdtr).append('\n');
        if (!remit.isEmpty())   m.append(":70:").append(cut(remit, 140)).append('\n');
        m.append(":71A:").append(chrgBr).append('\n');
        return m.toString();
    }

    // ------------------------------------------------ pacs.004 -> MT103 RETN
    private String pacs004ToMt103Retn(Document doc) {
        Element tx  = firstEl(doc.getDocumentElement(), "TxInf");
        String ref  = firstNonEmpty(text(doc, "RtrId"), text(doc, "MsgId"));
        String e2e  = text(doc, "OrgnlEndToEndId");
        String ccy  = attr(doc, "RtrdIntrBkSttlmAmt", "Ccy");
        String amt  = text(doc, "RtrdIntrBkSttlmAmt");
        String dt   = text(doc, "IntrBkSttlmDt");
        Element rrsn = firstEl(doc.getDocumentElement(), "RtrRsnInf");
        String cd   = ct(rrsn, "Cd");
        String addtl = ct(rrsn, "AddtlInf");

        StringBuilder m = new StringBuilder();
        m.append(":20:").append(cut(ref, 16)).append('\n');
        m.append(":23B:CRED").append('\n');
        m.append(":32A:").append(yymmdd(dt)).append(ccy).append(comma(amt)).append('\n');
        // Field 72: the return marker, reason code and free text (each line <= 35).
        m.append(":72:/RETN/").append(cut(cd.isEmpty() ? "NARR" : cd, 30)).append('\n');
        if (!addtl.isEmpty()) m.append("//").append(cut(addtl, 33)).append('\n');
        if (!e2e.isEmpty())   m.append("//ORIG ").append(cut(e2e, 28)).append('\n');
        return m.toString();
    }

    // ---------------------------------------------------- pain.001 -> MT101
    private String pain001ToMt101(Document doc) {
        String msgId = firstNonEmpty(text(doc, "MsgId"), text(doc, "PmtInfId"));
        Element rqd  = firstEl(doc.getDocumentElement(), "ReqdExctnDt");
        String dt    = (rqd == null) ? "" : firstNonEmpty(ct(rqd, "Dt"), rqd.getTextContent().trim());
        Element dbtr = firstEl(doc.getDocumentElement(), "Dbtr");
        String dbtrNm = ct(dbtr, "Nm");
        String dbtrIban = ct(firstEl(doc.getDocumentElement(), "DbtrAcct"), "IBAN");
        String dbtrAgt = firstText(doc, "DbtrAgt", "BICFI");

        Element tx = firstEl(doc.getDocumentElement(), "CdtTrfTxInf");
        String e2e = ct(tx, "EndToEndId");
        Element amtEl = (tx == null) ? null : firstEl(tx, "InstdAmt");
        String ccy = (amtEl == null) ? "" : amtEl.getAttribute("Ccy");
        String amt = (amtEl == null) ? "" : amtEl.getTextContent().trim();
        String cdtrAgt = ct(tx == null ? null : firstEl(tx, "CdtrAgt"), "BICFI");
        Element cdtr = (tx == null) ? null : firstEl(tx, "Cdtr");
        String cdtrNm = ct(cdtr, "Nm");
        String cdtrIban = ct(tx == null ? null : firstEl(tx, "CdtrAcct"), "IBAN");
        String remit = ct(tx, "Ustrd");
        String chrg = isoToCharges(text(doc, "ChrgBr"));

        StringBuilder m = new StringBuilder();
        m.append(":20:").append(cut(msgId, 16)).append('\n');
        m.append(":28D:1/1").append('\n');
        m.append(":50H:").append(acctLine(dbtrIban)).append(dbtrNm).append('\n');
        if (!dbtrAgt.isEmpty()) m.append(":52A:").append(dbtrAgt).append('\n');
        m.append(":30:").append(yymmdd(dt)).append('\n');
        m.append(":21:").append(cut(e2e, 16)).append('\n');
        m.append(":32B:").append(ccy).append(comma(amt)).append('\n');
        if (!cdtrAgt.isEmpty()) m.append(":57A:").append(cdtrAgt).append('\n');
        m.append(":59:").append(acctLine(cdtrIban)).append(cdtrNm).append('\n');
        if (!remit.isEmpty()) m.append(":70:").append(cut(remit, 140)).append('\n');
        m.append(":71A:").append(chrg).append('\n');
        return m.toString();
    }

    // ---------------------------------------------------- pain.008 -> MT104
    private String pain008ToMt104(Document doc) {
        String msgId = text(doc, "MsgId");
        String colDt = text(doc, "ReqdColltnDt");
        Element cdtr = firstEl(doc.getDocumentElement(), "Cdtr");
        String cdtrNm = ct(cdtr, "Nm");
        String cdtrIban = ct(firstEl(doc.getDocumentElement(), "CdtrAcct"), "IBAN");

        Element tx = firstEl(doc.getDocumentElement(), "DrctDbtTxInf");
        String e2e = ct(tx, "EndToEndId");
        Element amtEl = (tx == null) ? null : firstEl(tx, "InstdAmt");
        String ccy = (amtEl == null) ? "" : amtEl.getAttribute("Ccy");
        String amt = (amtEl == null) ? "" : amtEl.getTextContent().trim();
        String dbtrAgt = ct(tx == null ? null : firstEl(tx, "DbtrAgt"), "BICFI");
        Element dbtr = (tx == null) ? null : firstEl(tx, "Dbtr");
        String dbtrNm = ct(dbtr, "Nm");
        String dbtrIban = ct(tx == null ? null : firstEl(tx, "DbtrAcct"), "IBAN");
        String remit = ct(tx, "Ustrd");

        StringBuilder m = new StringBuilder();
        m.append(":20:").append(cut(msgId, 16)).append('\n');
        m.append(":30:").append(yymmdd(colDt)).append('\n');
        m.append(":21:").append(cut(e2e, 16)).append('\n');
        m.append(":32B:").append(ccy).append(comma(amt)).append('\n');
        m.append(":50K:").append(acctLine(cdtrIban)).append(cdtrNm).append('\n');   // creditor / originator
        if (!dbtrAgt.isEmpty()) m.append(":57A:").append(dbtrAgt).append('\n');
        m.append(":59:").append(acctLine(dbtrIban)).append(dbtrNm).append('\n');    // debtor / party debited
        if (!remit.isEmpty()) m.append(":70:").append(cut(remit, 140)).append('\n');
        m.append(":71A:SHA").append('\n');
        return m.toString();
    }

    // ---------------------------------------------------- camt.053 -> MT940
    private String camt053ToMt940(Document doc) {
        String msgId = text(doc, "MsgId");
        String iban  = ct(firstEl(doc.getDocumentElement(), "Acct"), "IBAN");
        Element bal  = firstEl(doc.getDocumentElement(), "Bal");
        String balCcy = ca(bal, "Amt", "Ccy");
        String balAmt = ct(bal, "Amt");
        String balDt  = ct(bal, "Dt");
        String balMark = "CRDT".equals(ct(bal, "CdtDbtInd")) ? "C" : "D";

        StringBuilder m = new StringBuilder();
        m.append(":20:").append(cut(msgId, 16)).append('\n');
        m.append(":25:").append(iban).append('\n');
        m.append(":28C:00001/00001").append('\n');
        m.append(":60F:").append(balMark).append(yymmdd(balDt)).append(balCcy).append("0,00").append('\n');
        for (Element ntry : els(doc.getDocumentElement(), "Ntry")) {
            String amt = ct(ntry, "Amt");
            String mark = "CRDT".equals(ct(ntry, "CdtDbtInd")) ? "C" : "D";
            String bookDt = firstNonEmpty(ct(firstEl(ntry, "BookgDt"), "Dt"), ct(ntry, "BookgDt"));
            String e2e = ct(ntry, "EndToEndId");
            String d6 = yymmdd(bookDt);
            String mmdd = d6.length() == 6 ? d6.substring(2) : "";
            m.append(":61:").append(d6).append(mmdd).append(mark).append(comma(amt))
             .append("NTRF").append(cut(e2e, 16)).append('\n');
            if (!e2e.isEmpty()) m.append(":86:").append(cut(e2e, 140)).append('\n');
        }
        m.append(":62F:").append(balMark).append(yymmdd(balDt)).append(balCcy).append(comma(balAmt)).append('\n');
        return m.toString();
    }

    // ------------------------------------------- camt.054 -> MT910 / MT900
    private String[] camt054ToMt9x0(Document doc) {
        String msgId = text(doc, "MsgId");
        String iban  = ct(firstEl(doc.getDocumentElement(), "Acct"), "IBAN");
        Element ntry = firstEl(doc.getDocumentElement(), "Ntry");
        boolean credit = "CRDT".equals(ct(ntry, "CdtDbtInd"));
        String ccy = ca(ntry, "Amt", "Ccy");
        String amt = ct(ntry, "Amt");
        String valDt = firstNonEmpty(ct(firstEl(ntry, "ValDt"), "Dt"), ct(ntry, "ValDt"));
        String e2e = ct(ntry, "EndToEndId");
        String uetr = ct(ntry, "UETR");

        StringBuilder m = new StringBuilder();
        m.append(":20:").append(cut(msgId, 16)).append('\n');
        if (!e2e.isEmpty()) m.append(":21:").append(cut(e2e, 16)).append('\n');
        m.append(":25:").append(iban).append('\n');
        m.append(":32A:").append(yymmdd(valDt)).append(ccy).append(comma(amt)).append('\n');
        if (!uetr.isEmpty()) m.append(":72:/UETR/").append(cut(uetr, 28)).append('\n');
        // MT910 = confirmation of credit; MT900 = confirmation of debit.
        return new String[]{ m.toString(), credit ? "MT910" : "MT900" };
    }

    // ---------------------------------------------------- camt.056 -> MT192
    private String camt056ToMt192(Document doc) {
        Element asgn = firstEl(doc.getDocumentElement(), "Assgnmt");
        String id  = ct(asgn, "Id");
        String e2e = text(doc, "OrgnlEndToEndId");
        String creDt = ct(asgn, "CreDtTm");
        Element rsn = firstEl(doc.getDocumentElement(), "CxlRsnInf");
        String cd = ct(rsn, "Cd");

        StringBuilder m = new StringBuilder();
        m.append(":20:").append(cut(id, 16)).append('\n');
        m.append(":21:").append(cut(e2e, 16)).append('\n');
        m.append(":11S:103\n").append(yymmdd(creDt)).append('\n');   // the original was an MT103
        m.append(":79:/").append(cut(cd.isEmpty() ? "NARR" : cd, 20)).append("/ Cancellation requested");
        if (!e2e.isEmpty()) m.append(" for ").append(cut(e2e, 20));
        m.append('\n');
        return m.toString();
    }

    // ---------------------------------------------------- pacs.002 -> MT199
    private String pacs002ToMt199(Document doc) {
        String msgId = text(doc, "MsgId");
        String e2e = text(doc, "OrgnlEndToEndId");
        String sts = text(doc, "TxSts");
        String ccy = attr(doc, "IntrBkSttlmAmt", "Ccy");
        String amt = text(doc, "IntrBkSttlmAmt");
        return statusMt199(msgId, e2e, sts, ccy, amt);
    }

    // ---------------------------------------------------- pain.002 -> MT199
    private String pain002ToMt199(Document doc) {
        String msgId = text(doc, "MsgId");
        String e2e = text(doc, "OrgnlEndToEndId");
        String sts = firstNonEmpty(text(doc, "TxSts"), text(doc, "GrpSts"));
        return statusMt199(msgId, e2e, sts, "", "");
    }

    private String statusMt199(String msgId, String e2e, String sts, String ccy, String amt) {
        StringBuilder m = new StringBuilder();
        m.append(":20:").append(cut(msgId, 16)).append('\n');
        if (!e2e.isEmpty()) m.append(":21:").append(cut(e2e, 16)).append('\n');
        m.append(":79:Payment status ").append(sts.isEmpty() ? "reported" : sts);
        if (!e2e.isEmpty()) m.append(" for reference ").append(e2e);
        m.append('.');
        if (!amt.isEmpty()) m.append('\n').append("Amount ").append(ccy).append(' ').append(amt).append('.');
        m.append('\n');
        return m.toString();
    }

    // ============================================================ MT -> MX
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

    // ================================================================ helpers

    /** The ISO message code (e.g. "pacs.008") from the schema namespace. */
    private static String detectIsoType(String xml) {
        Matcher m = Pattern.compile("xsd:([a-z]+\\.[0-9]{3})").matcher(xml);
        return m.find() ? m.group(1) : "";
    }

    private static Document parseXml(String xml) {
        try {
            DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
            f.setNamespaceAware(true);
            return f.newDocumentBuilder().parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not parse the ISO 20022 XML: " + e.getMessage());
        }
    }

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

    /** "/IBAN\n" prefix line for MT party fields, or "" when no account is known. */
    private static String acctLine(String iban) {
        return (iban == null || iban.isBlank()) ? "" : "/" + iban + "\n";
    }
    private static String yymmdd(String isoDate) {
        String d = isoDate == null ? "" : isoDate.trim();
        if (d.length() >= 10) return d.substring(2, 4) + d.substring(5, 7) + d.substring(8, 10);
        return "";
    }
    private static String comma(String amt) {
        return amt == null ? "" : amt.replace(".", ",");
    }
    private static String firstNonEmpty(String... vals) {
        for (String v : vals) if (v != null && !v.isBlank()) return v;
        return "";
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
    /** Text of the first `localName` descendant within `parent` (null-safe). */
    private static String ct(Element parent, String localName) {
        if (parent == null) return "";
        Element e = firstEl(parent, localName);
        return e == null ? "" : e.getTextContent().trim();
    }
    /** Attribute of the first `localName` descendant within `parent` (null-safe). */
    private static String ca(Element parent, String localName, String attrName) {
        if (parent == null) return "";
        Element e = firstEl(parent, localName);
        return e == null ? "" : e.getAttribute(attrName);
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
    /** Every `localName` descendant under `root`, in document order. */
    private static List<Element> els(Node root, String localName) {
        List<Element> out = new ArrayList<>();
        collect(root, localName, out);
        return out;
    }
    private static void collect(Node root, String localName, List<Element> out) {
        if (root == null) return;
        NodeList kids = root.getChildNodes();
        for (int i = 0; i < kids.getLength(); i++) {
            Node n = kids.item(i);
            if (n.getNodeType() == Node.ELEMENT_NODE) {
                if (localName.equals(n.getLocalName()) || localName.equals(n.getNodeName())) out.add((Element) n);
                collect(n, localName, out);
            }
        }
    }

    private static String nz(String s, String dflt) { return (s == null || s.isBlank()) ? dflt : s; }
    private static String cut(String s, int max) { return s == null ? "" : (s.length() <= max ? s : s.substring(0, max)); }
    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
