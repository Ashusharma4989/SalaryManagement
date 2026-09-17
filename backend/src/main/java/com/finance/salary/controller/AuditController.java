package com.finance.salary.controller;

import com.finance.salary.entity.AuditLog;
import com.finance.salary.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "50") int limit
    ) {
        List<AuditLog> logs = auditService.getAuditLogs(entityType, username, action, limit);
        return ResponseEntity.ok(logs);
    }
}
