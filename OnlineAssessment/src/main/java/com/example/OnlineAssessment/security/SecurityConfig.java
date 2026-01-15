package com.example.OnlineAssessment.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Allow index.html
                .requestMatchers("/", "/index.html","/faculty_help.html").permitAll()
                // Allow all static file types in the static folder
                .requestMatchers("/*.css", "/*.js", "/*.png", "/*.jpg", "/*.jpeg", 
                	"/*.gif", "/*.ico", "/Images/**","/model_sheets/**","/Reference_video/**").permitAll()
                // Public auth endpoints
                .requestMatchers("/auth/**", "/student/validate", "/faculty/validate","/admin/validate", "/ping").permitAll()
                // All other endpoints require JWT
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
