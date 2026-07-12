package in.iso20022academy.transform.dto;

/** Response body for POST /api/transform. */
public class TransformResponse {
    private boolean ok;
    private String result;        // the transformed message
    private String sourceFormat;  // e.g. "MT103"
    private String targetFormat;  // e.g. "pacs.008"
    private String message;       // error / info

    public static TransformResponse ok(String result, String sourceFormat, String targetFormat) {
        TransformResponse r = new TransformResponse();
        r.ok = true; r.result = result; r.sourceFormat = sourceFormat; r.targetFormat = targetFormat;
        return r;
    }
    public static TransformResponse error(String message) {
        TransformResponse r = new TransformResponse();
        r.ok = false; r.message = message;
        return r;
    }

    public boolean isOk() { return ok; }
    public void setOk(boolean ok) { this.ok = ok; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public String getSourceFormat() { return sourceFormat; }
    public void setSourceFormat(String sourceFormat) { this.sourceFormat = sourceFormat; }
    public String getTargetFormat() { return targetFormat; }
    public void setTargetFormat(String targetFormat) { this.targetFormat = targetFormat; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
