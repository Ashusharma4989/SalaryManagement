package com.finance.salary.controller;

import com.finance.salary.dto.ChatbotDTO;
import com.finance.salary.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping
    public ResponseEntity<ChatbotDTO> chat(@RequestBody ChatbotDTO dto) {
        if (dto.getQuery() == null || dto.getQuery().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        String reply = chatbotService.generateResponse(dto.getQuery());
        return ResponseEntity.ok(new ChatbotDTO(dto.getQuery(), reply));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory() {
        List<Map<String, Object>> history = chatbotService.getChatHistory();
        return ResponseEntity.ok(history);
    }

    @PostMapping("/history")
    public ResponseEntity<Void> saveHistory(@RequestBody List<Map<String, Object>> messages) {
        chatbotService.saveChatHistory(messages);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/history")
    public ResponseEntity<Void> clearHistory() {
        chatbotService.clearChatHistory();
        return ResponseEntity.noContent().build();
    }
}
