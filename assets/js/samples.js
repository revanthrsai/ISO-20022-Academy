// =============================================================================
// PLAYGROUND TOOL · SAMPLE MESSAGE LIBRARY  (Session 4.5)
// -----------------------------------------------------------------------------
// A browsable shelf of real, valid ISO 20022 sample messages — 2–3 per
// 300-level family (pain · pacs · camt · head · admi) — each loadable straight
// into the other Playground tools (Viewer · Validator · Transformer) with one
// click, so a learner never has to hand-paste XML to start experimenting.
//
// Self-contained: one global `SampleLibrary` object + its own injected styles,
// so it drops into the Playground page without touching the shared stylesheet.
// Loading is done through each tool's own public surface — the Viewer/Validator
// source textareas (+ their onInput), and MsgTransformer.loadModel() for the
// pacs.008 the Transformer speaks — so nothing here reaches into tool internals.
//
// Threaded to the Library: every sample is a beat of the same Bob → Sweety $400
// transfer (EndToEndId BOB-INV0042, the shared UETR eb6305c9…) the 300/500
// lessons follow — so the catalogue reads as one payment's whole life, not a
// pile of disconnected fixtures.
// =============================================================================

const SampleLibrary = (function () {
    const UETR = 'eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4';

    // -------------------------------------------------------------------------
    // CATALOGUE — keyed by stable id. Each entry: family, msg label, a one-line
    // sub, a short "what it is" note, the destinations it can load into, and the
    // well-formed XML itself. `dest` lists which tools the Load buttons offer —
    // every message reads in the Viewer and checks in the Validator; only the
    // pacs.008 (the language the Transformer speaks) offers Transform.
    // -------------------------------------------------------------------------
    const SAMPLES = {
        // ---- pain — customer ⇄ bank ----------------------------------------
        'pain.001': {
            family: 'pain', label: 'pain.001', kind: 'Initiation',
            sub: 'Customer Credit Transfer Initiation',
            note: 'Bob tells his bank to pay Sweety $400. Where the whole story starts.',
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>BOB-MSG-20260627-0001</MsgId>
      <CreDtTm>2026-06-27T09:28:14+04:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>400.00</CtrlSum>
      <InitgPty><Nm>Bob Marsh</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>BOB-PMT-0042</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>false</BtchBookg>
      <ReqdExctnDt><Dt>2026-06-27</Dt></ReqdExctnDt>
      <Dbtr>
        <Nm>Bob Marsh</Nm>
        <PstlAdr><StrtNm>Marina View</StrtNm><TwnNm>Dubai</TwnNm><Ctry>AE</Ctry></PstlAdr>
      </Dbtr>
      <DbtrAcct><Id><IBAN>AE070331234567890123456</IBAN></Id></DbtrAcct>
      <DbtrAgt><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></DbtrAgt>
      <ChrgBr>SHAR</ChrgBr>
      <CdtTrfTxInf>
        <PmtId><EndToEndId>BOB-INV0042</EndToEndId><UETR>${UETR}</UETR></PmtId>
        <Amt><InstdAmt Ccy="USD">400.00</InstdAmt></Amt>
        <CdtrAgt><FinInstnId><BICFI>HDFCINBB</BICFI></FinInstnId></CdtrAgt>
        <Cdtr>
          <Nm>Sweety Rao</Nm>
          <PstlAdr><StrtNm>MG Road</StrtNm><TwnNm>Bengaluru</TwnNm><Ctry>IN</Ctry></PstlAdr>
        </Cdtr>
        <CdtrAcct><Id><IBAN>IN52HDFC0000123456789012</IBAN></Id></CdtrAcct>
        <RmtInf><Ustrd>Invoice 0042 - June freelance</Ustrd></RmtInf>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`
        },
        'pain.002': {
            family: 'pain', label: 'pain.002', kind: 'Status',
            sub: 'Customer Payment Status Report',
            note: "Bob's bank answers his instruction: accepted, on its way.",
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.002.001.10">
  <CstmrPmtStsRpt>
    <GrpHdr>
      <MsgId>EBILAEAD-STS-20260627-01</MsgId>
      <CreDtTm>2026-06-27T09:29:02+04:00</CreDtTm>
      <InitgPty><Nm>Emirates Islamic Bank</Nm></InitgPty>
    </GrpHdr>
    <OrgnlGrpInfAndSts>
      <OrgnlMsgId>BOB-MSG-20260627-0001</OrgnlMsgId>
      <OrgnlMsgNmId>pain.001.001.09</OrgnlMsgNmId>
      <GrpSts>ACCP</GrpSts>
    </OrgnlGrpInfAndSts>
    <OrgnlPmtInfAndSts>
      <OrgnlPmtInfId>BOB-PMT-0042</OrgnlPmtInfId>
      <TxInfAndSts>
        <OrgnlEndToEndId>BOB-INV0042</OrgnlEndToEndId>
        <UETR>${UETR}</UETR>
        <TxSts>ACCP</TxSts>
        <StsRsnInf><Rsn><Cd>G000</Cd></Rsn></StsRsnInf>
      </TxInfAndSts>
    </OrgnlPmtInfAndSts>
  </CstmrPmtStsRpt>
</Document>`
        },
        'pain.008': {
            family: 'pain', label: 'pain.008', kind: 'Direct debit',
            sub: 'Customer Direct Debit Initiation',
            note: "The mirror image — a biller pulling funds instead of a payer pushing them.",
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.08">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>UTIL-DD-20260627-0007</MsgId>
      <CreDtTm>2026-06-27T06:00:00+04:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>120.00</CtrlSum>
      <InitgPty><Nm>Dubai Electricity Co</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>UTIL-PMT-0007</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <ReqdColltnDt>2026-06-30</ReqdColltnDt>
      <Cdtr><Nm>Dubai Electricity Co</Nm></Cdtr>
      <CdtrAcct><Id><IBAN>AE980331000000000099887</IBAN></Id></CdtrAcct>
      <CdtrAgt><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></CdtrAgt>
      <DrctDbtTxInf>
        <PmtId><EndToEndId>UTIL-JUN-0007</EndToEndId></PmtId>
        <InstdAmt Ccy="AED">120.00</InstdAmt>
        <DbtrAgt><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></DbtrAgt>
        <Dbtr><Nm>Bob Marsh</Nm></Dbtr>
        <DbtrAcct><Id><IBAN>AE070331234567890123456</IBAN></Id></DbtrAcct>
        <RmtInf><Ustrd>Electricity - June</Ustrd></RmtInf>
      </DrctDbtTxInf>
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`
        },

        // ---- pacs — bank ⇄ bank --------------------------------------------
        'pacs.008': {
            family: 'pacs', label: 'pacs.008', kind: 'Credit transfer',
            sub: 'FI-to-FI Customer Credit Transfer',
            note: "Bob's bank to Sweety's bank, on the wire. The one the Transformer speaks.",
            dest: ['viewer', 'validator', 'transformer'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>EBILAEAD-20260627-000400</MsgId>
      <CreDtTm>2026-06-27T09:30:00+04:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf><SttlmMtd>INDA</SttlmMtd></SttlmInf>
      <InstgAgt><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></InstgAgt>
      <InstdAgt><FinInstnId><BICFI>HDFCINBB</BICFI></FinInstnId></InstdAgt>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>EBILAEAD-INSTR-0400</InstrId>
        <EndToEndId>BOB-INV0042</EndToEndId>
        <UETR>${UETR}</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="USD">400.00</IntrBkSttlmAmt>
      <IntrBkSttlmDt>2026-06-27</IntrBkSttlmDt>
      <ChrgBr>SHAR</ChrgBr>
      <Dbtr><Nm>Bob Marsh</Nm></Dbtr>
      <DbtrAgt><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></DbtrAgt>
      <CdtrAgt><FinInstnId><BICFI>HDFCINBB</BICFI></FinInstnId></CdtrAgt>
      <Cdtr><Nm>Sweety Rao</Nm></Cdtr>
      <RmtInf><Ustrd>Invoice 0042 - June freelance</Ustrd></RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`
        },
        'pacs.002': {
            family: 'pacs', label: 'pacs.002', kind: 'Status',
            sub: 'FI-to-FI Payment Status Report',
            note: "Sweety's bank confirms back up the wire: settled, accepted.",
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.002.001.10">
  <FIToFIPmtStsRpt>
    <GrpHdr>
      <MsgId>HDFCINBB-STS-20260627-400</MsgId>
      <CreDtTm>2026-06-27T15:01:40+05:30</CreDtTm>
      <InstgAgt><FinInstnId><BICFI>HDFCINBB</BICFI></FinInstnId></InstgAgt>
      <InstdAgt><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></InstdAgt>
    </GrpHdr>
    <TxInfAndSts>
      <OrgnlInstrId>EBILAEAD-INSTR-0400</OrgnlInstrId>
      <OrgnlEndToEndId>BOB-INV0042</OrgnlEndToEndId>
      <UETR>${UETR}</UETR>
      <TxSts>ACSC</TxSts>
      <OrgnlTxRef><IntrBkSttlmAmt Ccy="USD">400.00</IntrBkSttlmAmt></OrgnlTxRef>
    </TxInfAndSts>
  </FIToFIPmtStsRpt>
</Document>`
        },
        'pacs.004': {
            family: 'pacs', label: 'pacs.004', kind: 'Return',
            sub: 'Payment Return',
            note: 'The unhappy path — the $400 sent back, settled funds returned with a reason.',
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.004.001.09">
  <PmtRtr>
    <GrpHdr>
      <MsgId>HDFCINBB-RTR-20260628-009</MsgId>
      <CreDtTm>2026-06-28T11:14:00+05:30</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf><SttlmMtd>INDA</SttlmMtd></SttlmInf>
    </GrpHdr>
    <TxInf>
      <RtrId>HDFCINBB-RTR-0400</RtrId>
      <OrgnlEndToEndId>BOB-INV0042</OrgnlEndToEndId>
      <UETR>${UETR}</UETR>
      <RtrdIntrBkSttlmAmt Ccy="USD">400.00</RtrdIntrBkSttlmAmt>
      <IntrBkSttlmDt>2026-06-28</IntrBkSttlmDt>
      <RtrRsnInf><Rsn><Cd>AC04</Cd></Rsn><AddtlInf>Closed account</AddtlInf></RtrRsnInf>
    </TxInf>
  </PmtRtr>
</Document>`
        },

        // ---- camt — reporting ----------------------------------------------
        'camt.054': {
            family: 'camt', label: 'camt.054', kind: 'Notification',
            sub: 'Bank-to-Customer Debit/Credit Notification',
            note: "Sweety's bank pings her the moment the $400 lands.",
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.054.001.08">
  <BkToCstmrDbtCdtNtfctn>
    <GrpHdr>
      <MsgId>HDFCINBB-NTF-20260627-77</MsgId>
      <CreDtTm>2026-06-27T15:02:11+05:30</CreDtTm>
    </GrpHdr>
    <Ntfctn>
      <Id>NTF-77-0042</Id>
      <Acct>
        <Id><IBAN>IN52HDFC0000123456789012</IBAN></Id>
        <Ownr><Nm>Sweety Rao</Nm></Ownr>
      </Acct>
      <Ntry>
        <Amt Ccy="USD">400.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts><Cd>BOOK</Cd></Sts>
        <BookgDt><DtTm>2026-06-27T15:02:00+05:30</DtTm></BookgDt>
        <ValDt><Dt>2026-06-27</Dt></ValDt>
        <NtryDtls><TxDtls>
          <Refs><EndToEndId>BOB-INV0042</EndToEndId><UETR>${UETR}</UETR></Refs>
          <RmtInf><Ustrd>Invoice 0042 - June freelance</Ustrd></RmtInf>
        </TxDtls></NtryDtls>
      </Ntry>
    </Ntfctn>
  </BkToCstmrDbtCdtNtfctn>
</Document>`
        },
        'camt.053': {
            family: 'camt', label: 'camt.053', kind: 'Statement',
            sub: 'Bank-to-Customer Statement',
            note: "End-of-day: the same credit, now a line on Sweety's statement.",
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08">
  <BkToCstmrStmt>
    <GrpHdr>
      <MsgId>HDFCINBB-STMT-20260627</MsgId>
      <CreDtTm>2026-06-27T23:59:00+05:30</CreDtTm>
    </GrpHdr>
    <Stmt>
      <Id>STMT-20260627-IN52</Id>
      <Acct>
        <Id><IBAN>IN52HDFC0000123456789012</IBAN></Id>
        <Ownr><Nm>Sweety Rao</Nm></Ownr>
      </Acct>
      <Bal>
        <Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="USD">400.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Dt><Dt>2026-06-27</Dt></Dt>
      </Bal>
      <Ntry>
        <Amt Ccy="USD">400.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts><Cd>BOOK</Cd></Sts>
        <BookgDt><Dt>2026-06-27</Dt></BookgDt>
        <NtryDtls><TxDtls>
          <Refs><EndToEndId>BOB-INV0042</EndToEndId><UETR>${UETR}</UETR></Refs>
        </TxDtls></NtryDtls>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>`
        },
        'camt.056': {
            family: 'camt', label: 'camt.056', kind: 'Cancellation',
            sub: 'FI-to-FI Payment Cancellation Request',
            note: 'Second thoughts — a request to recall the transfer before it is spent.',
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.056.001.08">
  <FIToFIPmtCxlReq>
    <Assgnmt>
      <Id>EBILAEAD-CXL-0400</Id>
      <Assgnr><Agt><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></Agt></Assgnr>
      <Assgne><Agt><FinInstnId><BICFI>HDFCINBB</BICFI></FinInstnId></Agt></Assgne>
      <CreDtTm>2026-06-27T16:40:00+04:00</CreDtTm>
    </Assgnmt>
    <Undrlyg>
      <TxInf>
        <CxlId>EBILAEAD-CXL-TX-0400</CxlId>
        <OrgnlEndToEndId>BOB-INV0042</OrgnlEndToEndId>
        <UETR>${UETR}</UETR>
        <OrgnlIntrBkSttlmAmt Ccy="USD">400.00</OrgnlIntrBkSttlmAmt>
        <CxlRsnInf><Rsn><Cd>DUPL</Cd></Rsn></CxlRsnInf>
      </TxInf>
    </Undrlyg>
  </FIToFIPmtCxlReq>
</Document>`
        },

        // ---- head — the envelope -------------------------------------------
        'head.001-pacs': {
            family: 'head', label: 'head.001', kind: 'BAH · over pacs.008',
            sub: 'Business Application Header',
            note: 'The envelope wrapped around the pacs.008 — who, to whom, which message.',
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<AppHdr xmlns="urn:iso:std:iso:20022:tech:xsd:head.001.001.02">
  <Fr><FIId><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></FIId></Fr>
  <To><FIId><FinInstnId><BICFI>HDFCINBB</BICFI></FinInstnId></FIId></To>
  <BizMsgIdr>EBILAEAD-20260627-000400</BizMsgIdr>
  <MsgDefIdr>pacs.008.001.08</MsgDefIdr>
  <BizSvc>swift.cbprplus.02</BizSvc>
  <CreDt>2026-06-27T09:30:00+04:00</CreDt>
  <Prty>NORM</Prty>
</AppHdr>`
        },
        'head.001-camt': {
            family: 'head', label: 'head.001', kind: 'BAH · over camt.054',
            sub: 'Business Application Header',
            note: 'The same envelope, this time around the notification flowing the other way.',
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<AppHdr xmlns="urn:iso:std:iso:20022:tech:xsd:head.001.001.02">
  <Fr><FIId><FinInstnId><BICFI>HDFCINBB</BICFI></FinInstnId></FIId></Fr>
  <To><FIId><FinInstnId><BICFI>HDFCINBB</BICFI></FinInstnId></FIId></To>
  <BizMsgIdr>HDFCINBB-NTF-20260627-77</BizMsgIdr>
  <MsgDefIdr>camt.054.001.08</MsgDefIdr>
  <BizSvc>swift.cbprplus.02</BizSvc>
  <CreDt>2026-06-27T15:02:11+05:30</CreDt>
  <Prty>NORM</Prty>
</AppHdr>`
        },

        // ---- admi — housekeeping -------------------------------------------
        'admi.004': {
            family: 'admi', label: 'admi.004', kind: 'System event',
            sub: 'System Event Notification',
            note: 'The network talking to itself — a value cut-off has been reached.',
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:admi.004.001.02">
  <SysEvtNtfctn>
    <EvtInf>
      <EvtCd>CUSC</EvtCd>
      <EvtParam>2026-06-27</EvtParam>
      <EvtParam>17:00:00+01:00</EvtParam>
      <EvtDesc>Same-day value cut-off reached; later items value tomorrow</EvtDesc>
      <EvtTm>2026-06-27T17:00:00+01:00</EvtTm>
    </EvtInf>
  </SysEvtNtfctn>
</Document>`
        },
        'admi.002': {
            family: 'admi', label: 'admi.002', kind: 'Message reject',
            sub: 'Message Reject',
            note: 'The network refusing a malformed message at the door, before any business logic.',
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:admi.002.001.01">
  <Admi.002.001.01>
    <RltdRef><Ref>EBILAEAD-20260627-000400</Ref></RltdRef>
    <Rsn>
      <RjctgPtyRsn>X09</RjctgPtyRsn>
      <RjctnDtTm>2026-06-27T09:30:05+04:00</RjctnDtTm>
      <ErrLctn>/Document/FIToFICstmrCdtTrf/CdtTrfTxInf/IntrBkSttlmAmt</ErrLctn>
      <AddtlData>Amount currency attribute missing</AddtlData>
    </Rsn>
  </Admi.002.001.01>
</Document>`
        },

        // ---- sese — securities settlement -----------------------------------
        'sese.023': {
            family: 'sese', label: 'sese.023', kind: 'Settlement instruction',
            sub: 'Securities Settlement Transaction Instruction',
            note: "Bob's pension fund buys 500 UAE government bonds — the instruction that tells the custodian to receive them against payment.",
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:sese.023.001.11">
  <SctiesSttlmTxInstr>
    <TxId>PFND-SETT-20260627-081</TxId>
    <SttlmTpAndAddtlParams>
      <SctiesMvmntTp>RECE</SctiesMvmntTp>
      <Pmt>APMT</Pmt>
    </SttlmTpAndAddtlParams>
    <TradDtls>
      <TradDt><Dt><Dt>2026-06-25</Dt></Dt></TradDt>
      <SttlmDt><Dt><Dt>2026-06-27</Dt></Dt></SttlmDt>
    </TradDtls>
    <FinInstrmId>
      <ISIN>AEG000000AB12</ISIN>
      <Desc>UAE Government Bond 3.2% 2031</Desc>
    </FinInstrmId>
    <QtyAndAcctDtls>
      <SttlmQty><Qty><Unit>500</Unit></Qty></SttlmQty>
      <SfkpgAcct><Id>SAFE-778341</Id></SfkpgAcct>
    </QtyAndAcctDtls>
    <SttlmParams>
      <SctiesTxTp><Cd>TRAD</Cd></SctiesTxTp>
    </SttlmParams>
    <RcvgSttlmPties>
      <Dpstry><Id><AnyBIC>CSDAAEA0XXX</AnyBIC></Id></Dpstry>
      <Pty1><Id><AnyBIC>EMIRAEADXXX</AnyBIC></Id></Pty1>
    </RcvgSttlmPties>
    <SttlmAmt>
      <Amt Ccy="AED">498750.00</Amt>
      <CdtDbtInd>DBIT</CdtDbtInd>
    </SttlmAmt>
  </SctiesSttlmTxInstr>
</Document>`
        },
        'semt.002': {
            family: 'semt', label: 'semt.002', kind: 'Custody statement',
            sub: 'Securities Balance Custody Report',
            note: "Month-end: the custodian reports what the pension fund actually holds — the camt.053 of the securities world.",
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:semt.002.001.11">
  <SctiesBalCtdyRpt>
    <Pgntn><PgNb>1</PgNb><LastPgInd>true</LastPgInd></Pgntn>
    <StmtGnlDtls>
      <RptNb><Shrt>047</Shrt></RptNb>
      <StmtDtTm><Dt>2026-06-30</Dt></StmtDtTm>
      <Frqcy><Cd>MNTH</Cd></Frqcy>
      <UpdTp><Cd>COMP</Cd></UpdTp>
    </StmtGnlDtls>
    <SfkpgAcct><Id>SAFE-778341</Id></SfkpgAcct>
    <BalForAcct>
      <FinInstrmId>
        <ISIN>AEG000000AB12</ISIN>
        <Desc>UAE Government Bond 3.2% 2031</Desc>
      </FinInstrmId>
      <AggtBal><Qty><Qty><Qty><Unit>500</Unit></Qty></Qty></Qty></AggtBal>
      <AcctBaseCcyAmts><HldgVal><Amt Ccy="AED">501200.00</Amt></HldgVal></AcctBaseCcyAmts>
    </BalForAcct>
  </SctiesBalCtdyRpt>
</Document>`
        },

        // ---- tsin — trade finance -------------------------------------------
        'tsin.001': {
            family: 'tsin', label: 'tsin.001', kind: 'Invoice financing',
            sub: 'Invoice Financing Request',
            note: "Sweety's employer waits 60 days for a customer to pay a ₹42 lakh invoice — so it asks its bank to advance the cash against it today.",
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:tsin.001.001.01">
  <InvcFincgReq>
    <ReqGrpInf>
      <GrpId>BNGL-FIN-20260627-003</GrpId>
      <CreDtTm>2026-06-27T11:05:00+05:30</CreDtTm>
      <NbOfInvcReqs>1</NbOfInvcReqs>
      <TtlBlkInvcAmt Ccy="INR">4200000.00</TtlBlkInvcAmt>
      <FincgAgrmtList>
        <Vndr><Nm>Karnataka Textile Works Pvt Ltd</Nm></Vndr>
        <FincgPty><Nm>Bangalore Mercantile Bank</Nm></FincgPty>
      </FincgAgrmtList>
    </ReqGrpInf>
    <InvcReqInf>
      <InvcGnlInf>
        <InvcNb>KTW-INV-2026-1188</InvcNb>
        <InvcDt>2026-06-20</InvcDt>
      </InvcGnlInf>
      <InvcTtlAmt Ccy="INR">4200000.00</InvcTtlAmt>
      <InvcDueDt>2026-08-19</InvcDueDt>
      <ReqdFincgAmt Ccy="INR">3780000.00</ReqdFincgAmt>
      <Buyr><Nm>Gulf Retail Group LLC</Nm></Buyr>
    </InvcReqInf>
  </InvcFincgReq>
</Document>`
        },

        // ---- caaa — cards ------------------------------------------------------
        'caaa.001': {
            family: 'caaa', label: 'caaa.001', kind: 'Card authorisation',
            sub: 'Acceptor Authorisation Request',
            note: 'Bob taps his card for coffee. Before the till beeps, this question races to the issuer: can he spend AED 18.50?',
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:caaa.001.001.13">
  <AccptrAuthstnReq>
    <Hdr>
      <MsgFctn>AUTQ</MsgFctn>
      <PrtcolVrsn>13.0</PrtcolVrsn>
      <XchgId>100482</XchgId>
      <CreDtTm>2026-06-27T08:12:44+04:00</CreDtTm>
      <InitgPty><Id>POS-DXB-00417</Id></InitgPty>
    </Hdr>
    <AuthstnReq>
      <Envt>
        <Mrchnt><Id><Id>MRCH-772100</Id></Id><CmonNm>Marina Beans Coffee</CmonNm></Mrchnt>
        <POI><Id><Id>TERM-0031</Id></Id></POI>
        <Card><PlainCardData><PAN>4539578763621486</PAN><XpryDt>2027-09</XpryDt></PlainCardData></Card>
      </Envt>
      <Tx>
        <TxId><TxDtTm>2026-06-27T08:12:44+04:00</TxDtTm><TxRef>POS-100482</TxRef></TxId>
        <TxDtls>
          <Ccy>AED</Ccy>
          <TtlAmt>18.50</TtlAmt>
          <OnLineRsn>ICCF</OnLineRsn>
        </TxDtls>
      </Tx>
    </AuthstnReq>
  </AccptrAuthstnReq>
</Document>`
        },

        // ---- fxtr — foreign exchange ------------------------------------------
        'fxtr.014': {
            family: 'fxtr', label: 'fxtr.014', kind: 'FX trade',
            sub: 'Foreign Exchange Trade Instruction',
            note: "Behind Bob's $400 sits a bigger machine: his bank sells USD for INR in the interbank market to cover the day's remittance flow.",
            dest: ['viewer', 'validator'],
            xml:
`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:fxtr.014.001.04">
  <FXTradInstr>
    <TradInf>
      <TradDt>2026-06-27</TradDt>
      <OrgtrRef>EMIR-FX-20260627-115</OrgtrRef>
    </TradInf>
    <TradgSdId>
      <SubmitgPty><AnyBIC><AnyBIC>EMIRAEADXXX</AnyBIC></AnyBIC></SubmitgPty>
    </TradgSdId>
    <CtrPtySdId>
      <SubmitgPty><AnyBIC><AnyBIC>HDFCINBBXXX</AnyBIC></AnyBIC></SubmitgPty>
    </CtrPtySdId>
    <TradAmts>
      <TradgSdBuyAmt Ccy="INR">8305000.00</TradgSdBuyAmt>
      <TradgSdSellAmt Ccy="USD">100000.00</TradgSdSellAmt>
      <SttlmDt>2026-06-29</SttlmDt>
    </TradAmts>
    <AgrdRate>
      <XchgRate>83.05</XchgRate>
      <UnitCcy>USD</UnitCcy>
      <QtdCcy>INR</QtdCcy>
    </AgrdRate>
  </FXTradInstr>
</Document>`
        }
    };

    // Display order, grouped by family.
    const ORDER = [
        'pain.001', 'pain.002', 'pain.008',
        'pacs.008', 'pacs.002', 'pacs.004',
        'camt.054', 'camt.053', 'camt.056',
        'head.001-pacs', 'head.001-camt',
        'admi.004', 'admi.002',
        'sese.023', 'semt.002',
        'tsin.001',
        'caaa.001',
        'fxtr.014'
    ];

    // The catalogue tree: ISO 20022 business domains → message families.
    const DOMAINS = [
        { id: 'payments',   label: 'Payments',         sub: 'pain · pacs · camt · head · admi',
          families: ['pain', 'pacs', 'camt', 'head', 'admi'] },
        { id: 'securities', label: 'Securities',       sub: 'sese · semt',
          families: ['sese', 'semt'] },
        { id: 'trade',      label: 'Trade Finance',    sub: 'tsin',
          families: ['tsin'] },
        { id: 'cards',      label: 'Cards',            sub: 'caaa',
          families: ['caaa'] },
        { id: 'fx',         label: 'Foreign Exchange', sub: 'fxtr',
          families: ['fxtr'] }
    ];
    const FAMILY_NAMES = {
        pain: 'Payments Initiation', pacs: 'Payments Clearing & Settlement',
        camt: 'Cash Management', head: 'Business Application Header',
        admi: 'Administration', sese: 'Securities Settlement',
        semt: 'Securities Management', tsin: 'Trade Services Initiation',
        caaa: 'Acceptor to Acquirer', fxtr: 'FX Trade'
    };
    function domainOf(family) {
        const d = DOMAINS.find(d => d.families.includes(family));
        return d ? d.id : 'payments';
    }

    const DEST_LABEL = { viewer: 'View', validator: 'Validate', transformer: 'Transform' };

    // -------------------------------------------------------------------------
    // STATE — one selected tree node: whole catalogue, a domain, or one family.
    // -------------------------------------------------------------------------
    let sel = { type: 'none', id: null };   // 'none' | 'all' | 'domain' | 'family'
    let openDomains = { payments: true };
    let mountId = 'smp-root';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // -------------------------------------------------------------------------
    // LOAD — drive each target tool through its own public surface only.
    //   • Viewer / Validator: switch to the tool, fill its source textarea, fire
    //     the tool's own onInput so it re-parses exactly as if pasted.
    //   • Transformer: parse the pacs.008 into the canonical model and hand it to
    //     MsgTransformer.loadModel().
    // setPlaygroundTool() (app.js) initialises the destination synchronously, so
    // its DOM exists by the time we write into it.
    // -------------------------------------------------------------------------
    function loadInto(dest, key) {
        const s = SAMPLES[key];
        if (!s) return;
        if (typeof window.setPlaygroundTool === 'function') window.setPlaygroundTool(dest);

        if (dest === 'viewer') {
            const ta = document.getElementById('xv-src');
            if (ta && window.XmlViewer) {
                ta.value = s.xml; XmlViewer.onInput();
                // Label the reader with the sample's own description, not "Pasted message".
                const meta = document.querySelector('.xv-src-sub');
                if (meta) meta.textContent = s.label + ' — ' + s.sub;
            }
        } else if (dest === 'validator') {
            const ta = document.getElementById('val-src');
            if (ta && window.SchemaValidator) {
                ta.value = s.xml; SchemaValidator.onInput();
                const meta = document.querySelector('.val-src-sub');
                if (meta) meta.textContent = s.label + ' — ' + s.sub;
            }
        } else if (dest === 'transformer') {
            if (window.MsgTransformer && typeof MsgTransformer.loadModel === 'function') {
                MsgTransformer.loadModel(pacsToModel(s.xml));
            }
        }
    }

    // Pull the transformer's canonical model out of a pacs.008.
    function pacsToModel(xml) {
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const get = (sel) => { const n = doc.querySelector(sel); return n ? (n.textContent || '').trim() : ''; };
        const getAttr = (sel, a) => { const n = doc.querySelector(sel); return n ? (n.getAttribute(a) || '') : ''; };
        const amt = doc.querySelector('IntrBkSttlmAmt');
        const model = {
            ref: get('CdtTrfTxInf > PmtId > EndToEndId') || get('EndToEndId'),
            valDate: get('IntrBkSttlmDt'),
            ccy: amt ? (amt.getAttribute('Ccy') || '') : '',
            amount: amt ? (amt.textContent || '').trim() : '',
            dbtrNm: get('Dbtr > Nm'),
            dbtrAgt: get('DbtrAgt BICFI'),
            cdtrAgt: get('CdtrAgt BICFI'),
            cdtrNm: get('Cdtr > Nm'),
            rmt: get('RmtInf > Ustrd'),
            chrg: get('ChrgBr')
        };
        // Drop empties so the transformer keeps its sensible defaults for anything absent.
        Object.keys(model).forEach(k => { if (!model[k]) delete model[k]; });
        return model;
    }

    // -------------------------------------------------------------------------
    // RENDER — catalogue tree (left) + sample cards (right)
    // -------------------------------------------------------------------------
    function select(type, id) {
        sel = { type, id };
        if (type === 'domain') openDomains[id] = true;
        if (type === 'family') openDomains[domainOf(id)] = true;
        render();
    }
    function toggleDomain(id) {
        openDomains[id] = !openDomains[id];
        sel = { type: 'domain', id };   // select the domain too, so its cards filter in (and others drop out)
        render();
    }
    // Back-compat shim (old chip API): map family/all onto the tree selection.
    function setFilter(f) {
        if (f === 'all') select('all', null); else select('family', f);
    }

    function visibleKeys() {
        if (sel.type === 'all') return ORDER.slice();
        if (sel.type === 'domain') {
            const d = DOMAINS.find(x => x.id === sel.id);
            return ORDER.filter(k => d && d.families.includes(SAMPLES[k].family));
        }
        return ORDER.filter(k => SAMPLES[k].family === sel.id);
    }

    function treeHtml() {
        const allOn = sel.type === 'all';
        const domainRows = DOMAINS.map(d => {
            const open = !!openDomains[d.id];
            const on = sel.type === 'domain' && sel.id === d.id;
            const fams = d.families.map(f => {
                const n = ORDER.filter(k => SAMPLES[k].family === f).length;
                const fOn = sel.type === 'family' && sel.id === f;
                return `<button class="smp-tree-fam${fOn ? ' is-on' : ''}" onclick="SampleLibrary.select('family', '${f}')">
                    <span class="smp-tree-fam-code">${esc(f)}</span>
                    <span class="smp-tree-fam-n">${n}</span>
                </button>`;
            }).join('');
            return `<div class="smp-tree-domain${open ? ' is-open' : ''}">
                <div class="smp-tree-row">
                    <button class="smp-tree-caret" aria-label="${open ? 'Collapse' : 'Expand'} ${esc(d.label)}" onclick="SampleLibrary.toggleDomain('${d.id}')">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                    </button>
                    <button class="smp-tree-node${on ? ' is-on' : ''}" onclick="SampleLibrary.select('domain', '${d.id}')">
                        <span class="smp-tree-name">${esc(d.label)}</span>
                        <span class="smp-tree-sub">${esc(d.sub)}</span>
                    </button>
                </div>
                <div class="smp-tree-fams">${fams}</div>
            </div>`;
        }).join('');
        return `<nav class="smp-tree" aria-label="ISO 20022 catalogue">
            <button class="smp-tree-root${allOn ? ' is-on' : ''}" onclick="SampleLibrary.select('all', null)">
                <span class="smp-tree-name">ISO 20022 Catalogue</span>
                <span class="smp-tree-sub">every sample</span>
            </button>
            ${domainRows}
        </nav>`;
    }

    function headingFor() {
        if (sel.type === 'all') return 'ISO 20022 Catalogue';
        if (sel.type === 'domain') {
            const d = DOMAINS.find(x => x.id === sel.id);
            return d ? d.label : '';
        }
        return `${sel.id} — ${FAMILY_NAMES[sel.id] || ''}`;
    }

    // The whole card is one action: open the message in the reader (viewer),
    // where the Transform / Validate / Compare handoff bar takes over.
    function cardHtml(key) {
        const s = SAMPLES[key];
        return `<article class="smp-card" data-key="${esc(key)}" data-fam="${s.family}" role="button" tabindex="0"
            onclick="SampleLibrary.open('${key}')"
            onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();SampleLibrary.open('${key}');}">
            <header class="smp-card-head">
                <span class="smp-fam smp-fam-${s.family}">${esc(s.family)}</span>
                <span class="smp-kind">${esc(s.kind)}</span>
            </header>
            <h3 class="smp-name">${esc(s.label)}</h3>
            <p class="smp-sub">${esc(s.sub)}</p>
            <p class="smp-note">${esc(s.note)}</p>
            <div class="smp-open"><span class="smp-open-ar">&rarr;</span>open in reader</div>
        </article>`;
    }

    // Open a sample in the reader (viewer). The card's single click-through.
    function open(key) {
        loadInto('viewer', key);
    }

    // "Paste your own" — an empty reader, cursor ready.
    function pasteOwn() {
        if (typeof window.setPlaygroundTool === 'function') window.setPlaygroundTool('viewer');
        if (window.XmlViewer && typeof XmlViewer.clear === 'function') XmlViewer.clear();
        const ta = document.getElementById('xv-src');
        if (ta) ta.focus();
    }

    function render() {
        const root = document.getElementById(mountId);
        if (!root) return;
        let main;
        if (sel.type === 'none') {
            main = `<div class="smp-empty">
                    <p class="smp-empty-text">Paste your own XML message, or pick one from the catalogue to explore.</p>
                    <button class="smp-paste smp-empty-btn" onclick="SampleLibrary.pasteOwn()"><span class="smp-paste-plus">+</span> Paste your own message</button>
                </div>`;
        } else {
            const keys = visibleKeys();
            const count = keys.length;
            main = `
                    <div class="smp-bar">
                        <span class="smp-heading">${esc(headingFor())}</span>
                        <span class="smp-count">${count} sample${count === 1 ? '' : 's'}</span>
                        <button class="smp-paste" onclick="SampleLibrary.pasteOwn()">
                            <span class="smp-paste-plus">+</span> Paste your own message
                        </button>
                    </div>
                    <div class="smp-grid">${keys.map(cardHtml).join('')}</div>`;
        }
        root.innerHTML = `
            <div class="smp-layout">
                ${treeHtml()}
                <div class="smp-main">${main}</div>
            </div>
        `;
    }

    // -------------------------------------------------------------------------
    // STYLES — injected once, theme-aware (reads the global CSS variables).
    // -------------------------------------------------------------------------
    function injectStyles() {
        if (document.getElementById('smp-styles')) return;
        const css = `
        .smp { display: flex; flex-direction: column; gap: 20px; }
        .smp-empty {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 20px; min-height: 360px; text-align: center; padding: 46px;
            border: 1.5px solid var(--primary); border-radius: var(--radius-lg);
            background: linear-gradient(180deg, rgba(16,185,129,0.06), rgba(16,185,129,0.015));
            box-shadow: 0 0 0 4px rgba(16,185,129,0.08), 0 12px 36px rgba(16,185,129,0.16), inset 0 1px 0 rgba(255,255,255,0.65);
        }
        .smp-empty-text { font-size: 15px; color: var(--text-muted); max-width: 400px; line-height: 1.55; margin: 0; }
        .smp-empty .smp-empty-btn { margin-left: auto; margin-right: auto; }

        /* Catalogue tree (left) + samples (right) */
        .smp-layout {
            display: grid; grid-template-columns: 250px minmax(0, 1fr);
            gap: 26px; align-items: start;
        }
        .smp-tree {
            position: sticky; top: 96px;
            display: flex; flex-direction: column; gap: 4px;
            padding: 14px; border: 1px solid var(--border);
            border-radius: var(--radius-md); background: var(--surface);
        }
        .smp-tree-root {
            display: flex; flex-direction: column; gap: 1px; text-align: left;
            padding: 9px 10px; margin-bottom: 6px;
            background: transparent; border: 1px solid transparent;
            border-radius: var(--radius-sm); cursor: pointer; color: var(--text);
        }
        .smp-tree-root:hover { background: var(--surface-alt); }
        .smp-tree-root.is-on { border-color: var(--primary-deep); background: var(--glass-tint-strong); }
        .smp-tree-domain { border-top: 1px solid var(--border); padding-top: 4px; }
        .smp-tree-row { display: flex; align-items: center; gap: 2px; }
        .smp-tree-caret {
            flex-shrink: 0; display: flex; align-items: center; justify-content: center;
            width: 22px; height: 22px; padding: 0;
            background: transparent; border: none; cursor: pointer;
            color: var(--text-faint);
            transition: transform var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
        }
        .smp-tree-caret:hover { color: var(--text); }
        .smp-tree-domain.is-open > .smp-tree-row .smp-tree-caret { transform: rotate(90deg); }
        .smp-tree-node {
            flex: 1; display: flex; flex-direction: column; gap: 1px; text-align: left;
            padding: 8px 10px; background: transparent;
            border: 1px solid transparent; border-radius: var(--radius-sm);
            cursor: pointer; color: var(--text-muted); min-width: 0;
        }
        .smp-tree-node:hover { background: var(--surface-alt); color: var(--text); }
        .smp-tree-node.is-on { border-color: var(--primary-deep); background: var(--glass-tint-strong); color: var(--text); }
        .smp-tree-name { font-family: var(--font-display); font-weight: 700; font-size: 13.5px; }
        .smp-tree-sub { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.03em; color: var(--text-faint); }
        .smp-tree-fams { display: none; flex-direction: column; gap: 2px; padding: 2px 0 8px 30px; }
        .smp-tree-domain.is-open .smp-tree-fams { display: flex; }
        .smp-tree-fam {
            display: flex; align-items: center; justify-content: space-between; gap: 8px;
            padding: 5px 9px; background: transparent;
            border: 1px solid transparent; border-radius: var(--radius-sm);
            cursor: pointer; color: var(--text-muted);
            font-family: var(--font-mono); font-size: 12px;
        }
        .smp-tree-fam:hover { background: var(--surface-alt); color: var(--text); }
        .smp-tree-fam.is-on { border-color: var(--primary-deep); background: var(--glass-tint-strong); color: var(--primary-bright); }
        .smp-tree-fam-n { font-size: 10px; color: var(--text-faint); }

        .smp-main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .smp-bar { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .smp-heading { font-family: var(--font-display); font-weight: 700; font-size: 17px; color: var(--text); }
        .smp-count { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em; color: var(--text-faint); }

        .smp-grid {
            display: grid; gap: 16px;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }
        @media (max-width: 860px) {
            .smp-layout { display: block; }
            .smp-tree { position: static; margin-bottom: 18px; }
        }

        .smp-card {
            display: flex; flex-direction: column; gap: 8px;
            padding: 18px 18px 16px; min-width: 0;
            background: var(--surface); border: 1px solid var(--border);
            border-radius: var(--radius-md);
            transition: border-color var(--dur-fast) var(--ease-out),
                        transform var(--dur-fast) var(--ease-out);
        }
        .smp-card { cursor: pointer; }
        .smp-card:hover { border-color: var(--primary-deep); transform: translateY(-2px); }
        .smp-card:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
        .smp-card-head { display: flex; align-items: center; gap: 9px; }
        .smp-fam {
            font-family: var(--font-mono); font-size: 10px; font-weight: 700;
            letter-spacing: 0.08em; text-transform: uppercase;
            padding: 3px 9px; border-radius: var(--radius-pill);
            background: var(--glass-tint-strong); color: var(--primary-bright);
        }
        .smp-fam-pain { color: var(--primary-bright); }
        .smp-fam-pacs { color: var(--warning); }
        .smp-fam-camt { color: var(--text); }
        .smp-kind {
            font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.03em;
            color: var(--text-faint);
        }
        .smp-name {
            font-family: var(--font-mono); font-size: 18px; font-weight: 700;
            color: var(--text); margin: 2px 0 0; letter-spacing: -0.01em;
        }
        .smp-sub { font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.4; }
        .smp-note { font-size: 12.5px; color: var(--text-faint); margin: 0; line-height: 1.55; flex: 1; }

        .smp-open {
            display: inline-flex; align-items: center; gap: 6px; margin-top: 8px;
            padding-top: 14px; border-top: 1px solid var(--border);
            font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.02em;
            color: var(--text-faint);
            transition: color var(--dur-fast) var(--ease-out);
        }
        .smp-open-ar { color: var(--primary); font-weight: 700; transition: transform var(--dur-fast) var(--ease-out); }
        .smp-card:hover .smp-open { color: var(--text); }
        .smp-card:hover .smp-open-ar { transform: translateX(3px); }
        .smp-paste {
            display: inline-flex; align-items: center; gap: 6px; margin-left: auto;
            padding: 6px 14px; border-radius: var(--radius-pill);
            background: transparent; border: 1px dashed var(--border-hi);
            color: var(--text-muted); cursor: pointer;
            font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.02em;
            transition: border-color var(--dur-fast) var(--ease-out),
                        color var(--dur-fast) var(--ease-out),
                        background var(--dur-fast) var(--ease-out);
        }
        .smp-paste:hover { border-color: var(--primary-deep); border-style: solid; color: var(--text); background: var(--glass-tint-strong); }
        .smp-paste-plus { color: var(--primary); font-weight: 700; }
        `;
        const style = document.createElement('style');
        style.id = 'smp-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // -------------------------------------------------------------------------
    // INIT — call after the mount container exists.
    // -------------------------------------------------------------------------
    function init(id) {
        mountId = id || 'smp-root';
        injectStyles();
        render();
    }

    return { init, setFilter, select, toggleDomain, loadInto, open, pasteOwn };
})();

window.SampleLibrary = SampleLibrary;
