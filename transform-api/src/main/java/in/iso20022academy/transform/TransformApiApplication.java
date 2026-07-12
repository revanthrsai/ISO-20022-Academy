package in.iso20022academy.transform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ISO 20022 Academy — Transform API.
 *
 * A small, stateless service that converts between the legacy SWIFT MT world
 * and ISO 20022 MX (starting with MT103 <-> pacs.008), so the Playground's
 * Transform view can call a real, server-side engine instead of hand-rolled
 * client JavaScript. MT parsing/building uses Prowide Core (Apache 2.0); the
 * field mapping is coded explicitly here (no commercial translator required).
 */
@SpringBootApplication
public class TransformApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(TransformApiApplication.class, args);
    }
}
