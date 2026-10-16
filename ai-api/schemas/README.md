# Official ISO 20022 schemas (optional)

Drop official XSD files here, named by their full message identifier, and every
AI result is validated against them as well:

    pacs.008.001.08.xsd
    pain.001.001.09.xsd
    camt.053.001.08.xsd
    ...

Download them from the ISO 20022 message catalogue (iso20022.org) or your
SWIFT MyStandards usage guidelines. Without them, the service still runs its
built-in checks (structure, namespace, IBAN, BIC, dates, amounts, NbOfTxs,
CtrlSum, mandatory MT fields).
