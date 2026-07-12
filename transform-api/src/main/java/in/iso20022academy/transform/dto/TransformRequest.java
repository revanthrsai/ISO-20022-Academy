package in.iso20022academy.transform.dto;

/**
 * Request body for POST /api/transform.
 *
 * @param source    the raw message (MT text block or MX/pacs.008 XML)
 * @param direction "MT_TO_MX", "MX_TO_MT", or "AUTO" (detect from the content)
 */
public class TransformRequest {
    private String source;
    private String direction = "AUTO";

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }
}
