package in.iso20022academy.transform;

import in.iso20022academy.transform.dto.TransformRequest;
import in.iso20022academy.transform.dto.TransformResponse;
import in.iso20022academy.transform.service.TransformService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class TransformController {

    private static final Logger log = LoggerFactory.getLogger(TransformController.class);
    private final TransformService service;

    public TransformController(TransformService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "up", "service", "iso20022-transform-api");
    }

    /**
     * Transform a message between MT and MX.
     * Body: { "source": "...", "direction": "AUTO" | "MT_TO_MX" | "MX_TO_MT" }
     */
    @PostMapping("/transform")
    public ResponseEntity<TransformResponse> transform(@RequestBody TransformRequest req) {
        if (req == null || req.getSource() == null || req.getSource().isBlank()) {
            return ResponseEntity.badRequest().body(TransformResponse.error("Empty 'source'."));
        }
        try {
            return ResponseEntity.ok(service.transform(req.getSource(), req.getDirection()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(TransformResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Transform failed", e);
            return ResponseEntity.internalServerError()
                    .body(TransformResponse.error("Transform failed: " + e.getClass().getSimpleName() + ": " + e.getMessage()));
        }
    }
}
