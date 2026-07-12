package in.iso20022academy.transform.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS — the Playground is a static site on a different origin
 * (iso20022academy.in / GitHub Pages), so the browser must be allowed to call
 * this API cross-origin. Add your local dev origin as needed.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "https://iso20022academy.in",
                        "https://www.iso20022academy.in",
                        "http://localhost:5500",
                        "http://127.0.0.1:5500")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
