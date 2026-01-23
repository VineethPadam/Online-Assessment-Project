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
						// Public pages
						.requestMatchers("/", "/index.html", "/faculty_help.html").permitAll()

						// Static files
						.requestMatchers(
								"/*.css", "/*.js", "/*.png", "/*.jpg", "/*.jpeg",
								"/*.gif", "/*.ico",
								"/Images/**", "/model_sheets/**", "/Reference_video/**")
						.permitAll()

						// Auth endpoints (login etc.)
						.requestMatchers(
								"/auth/**",
								"/student/validate",
								"/faculty/validate",
								"/admin/validate",
								"/ping",
								"/password/student/**", // <-- add this
								"/password/faculty/**",
								"/error")
						.permitAll()

						// ✅ All /departments and /results endpoints require JWT but any role
						.requestMatchers("/departments/**", "/results/**").authenticated()

						// Everything else secured
						.anyRequest().authenticated())

				.sessionManagement(session -> session
						.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

		http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
