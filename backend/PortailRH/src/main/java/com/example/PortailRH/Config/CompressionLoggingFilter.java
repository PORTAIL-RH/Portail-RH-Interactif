package com.example.PortailRH.Config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class CompressionLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        filterChain.doFilter(request, response);

        String encoding = response.getHeader("Content-Encoding");
        if ("gzip".equalsIgnoreCase(encoding)) {
            logger.info("Response compressed with GZIP for: " + request.getRequestURI());
        } else {
            logger.info("Response NOT compressed for: " + request.getRequestURI());
        }
    }
}
