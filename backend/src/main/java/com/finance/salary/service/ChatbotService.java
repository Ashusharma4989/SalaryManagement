package com.finance.salary.service;

import com.finance.salary.entity.ChatHistory;
import com.finance.salary.entity.Department;
import com.finance.salary.entity.Employee;
import com.finance.salary.entity.PayPeriod;
import com.finance.salary.entity.SalaryItem;
import com.finance.salary.entity.SalaryRecord;
import com.finance.salary.entity.User;
import com.finance.salary.repository.ChatHistoryRepository;
import com.finance.salary.repository.DepartmentRepository;
import com.finance.salary.repository.EmployeeRepository;
import com.finance.salary.repository.PayPeriodRepository;
import com.finance.salary.repository.SalaryRecordRepository;
import com.finance.salary.repository.UserRepository;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ChatbotService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final ChatHistoryRepository chatHistoryRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final PayPeriodRepository payPeriodRepository;
    private final SalaryRecordRepository salaryRecordRepository;
    private final UserRepository userRepository;

    @Value("${app.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${app.ollama.model:llama3.2:3b}")
    private String ollamaModel;

    public String generateResponse(String userQuery) {
        String context = buildDbContext();

        String prompt = """
            You are a helpful assistant for a salary management system.
            Answer the user's question based ONLY on the data provided below.
            If the data doesn't contain the answer, say "I don't have that information in the system."

            Database context:
            %s

            User's question: %s

            Answer:
            """.formatted(context, userQuery);

        try {
            java.util.Map<String, Object> requestBody = java.util.Map.of(
                "model", ollamaModel,
                "prompt", prompt,
                "stream", false,
                "options", java.util.Map.of(
                    "temperature", 0.3,
                    "num_ctx", 4096
                )
            );

            java.util.Map<String, Object> response = restTemplate.postForObject(
                ollamaBaseUrl + "/api/generate",
                requestBody,
                java.util.Map.class
            );

            if (response != null && response.containsKey("response")) {
                return (String) response.get("response");
            }
            return "I couldn't get a response from the AI model. Please ensure Ollama is running with the model loaded.";
        } catch (RestClientException e) {
            log.warn("Failed to call Ollama API: {}", e.getMessage());
            return "I'm offline right now. Please ensure Ollama is running with the model loaded.";
        }
    }

    private String buildDbContext() {
        StringBuilder sb = new StringBuilder();

        List<Department> departments = departmentRepository.findAll();
        sb.append("Departments:\n");
        if (departments.isEmpty()) {
            sb.append("- (none)\n");
        } else {
            for (Department d : departments) {
                sb.append("- ID=").append(d.getId()).append(", Name=").append(d.getName()).append("\n");
            }
        }

        List<Employee> employees = employeeRepository.findAll();
        sb.append("\nEmployees:\n");
        if (employees.isEmpty()) {
            sb.append("- (none)\n");
        } else {
            for (Employee e : employees) {
                String deptName = e.getDepartment() != null ? e.getDepartment().getName() : "None";
                sb.append("- ID=").append(e.getId())
                  .append(", EmpNum=").append(e.getEmployeeNumber())
                  .append(", Name=").append(e.getFirstName()).append(" ").append(e.getLastName())
                  .append(", Email=").append(e.getEmail() != null ? e.getEmail() : "N/A")
                  .append(", Dept=").append(deptName)
                  .append(", Location=").append(e.getLocation() != null ? e.getLocation() : "N/A")
                  .append(", Currency=").append(e.getCurrencyCode() != null ? e.getCurrencyCode() : "N/A")
                  .append("\n");
            }
        }

        List<PayPeriod> payPeriods = payPeriodRepository.findAll();
        sb.append("\nPay Periods:\n");
        if (payPeriods.isEmpty()) {
            sb.append("- (none)\n");
        } else {
            for (PayPeriod p : payPeriods) {
                sb.append("- ID=").append(p.getId())
                  .append(", Start=").append(p.getStartDate())
                  .append(", End=").append(p.getEndDate())
                  .append(", Status=").append(p.getStatus())
                  .append("\n");
            }
        }

        List<SalaryRecord> records = salaryRecordRepository.findAll();
        sb.append("\nSalary Records:\n");
        if (records.isEmpty()) {
            sb.append("- (none)\n");
        } else {
            for (SalaryRecord r : records) {
                String empName = r.getEmployee() != null
                    ? r.getEmployee().getFirstName() + " " + r.getEmployee().getLastName()
                    : "Unknown";
                String pp = r.getPayPeriod() != null
                    ? r.getPayPeriod().getStartDate() + " to " + r.getPayPeriod().getEndDate()
                    : "Unknown";
                String processedBy = r.getProcessedBy() != null
                    ? r.getProcessedBy().getUsername()
                    : "N/A";
                sb.append("- ID=").append(r.getId())
                  .append(", Employee=").append(empName)
                  .append(", Period=").append(pp)
                  .append(", BaseSalary=").append(r.getBaseSalary())
                  .append(", Currency=").append(r.getCurrencyCode())
                  .append(", Gross=").append(r.getGross())
                  .append(", Deductions=").append(r.getTotalDeductions())
                  .append(", Net=").append(r.getNet())
                  .append(", Status=").append(r.getStatus())
                  .append(", ProcessedBy=").append(processedBy)
                  .append("\n");
                for (SalaryItem item : r.getSalaryItems()) {
                    sb.append("    Item: [").append(item.getType())
                      .append("] ").append(item.getName())
                      .append(": ").append(item.getAmount())
                      .append("\n");
                }
            }
        }

        List<User> users = userRepository.findAll();
        sb.append("\nUsers:\n");
        if (users.isEmpty()) {
            sb.append("- (none)\n");
        } else {
            for (User u : users) {
                sb.append("- ID=").append(u.getId())
                  .append(", Username=").append(u.getUsername())
                  .append(", Role=").append(u.getRole())
                  .append("\n");
            }
        }

        return sb.toString();
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        return userOpt.map(User::getId).orElse(null);
    }

    public List<Map<String, Object>> getChatHistory() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return Collections.emptyList();
        }
        Optional<ChatHistory> historyOpt = chatHistoryRepository.findByUserId(userId);
        if (historyOpt.isEmpty() || historyOpt.get().getMessages() == null) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(historyOpt.get().getMessages(), List.class);
        } catch (JacksonException e) {
            log.warn("Failed to parse chat history for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    @Transactional
    public void saveChatHistory(List<Map<String, Object>> messages) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            log.warn("Cannot save chat history: no authenticated user");
            return;
        }
        try {
            String json = objectMapper.writeValueAsString(messages);
            Optional<ChatHistory> existing = chatHistoryRepository.findByUserId(userId);
            if (existing.isPresent()) {
                ChatHistory history = existing.get();
                history.setMessages(json);
                history.setUpdatedAt(LocalDateTime.now());
                chatHistoryRepository.save(history);
            } else {
                ChatHistory history = new ChatHistory();
                history.setUserId(userId);
                history.setMessages(json);
                chatHistoryRepository.save(history);
            }
        } catch (JacksonException e) {
            log.error("Failed to serialize chat history: {}", e.getMessage());
        }
    }

    @Transactional
    public void clearChatHistory() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return;
        }
        chatHistoryRepository.deleteByUserId(userId);
    }
}
