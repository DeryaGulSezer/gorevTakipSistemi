package com.erdemirProje.gorevTakip.controller;

import com.erdemirProje.gorevTakip.dto.GorevDto;
import com.erdemirProje.gorevTakip.service.DirectorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/director")
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"})
@RequiredArgsConstructor
public class DirectorController {

    private final DirectorService directorService;

    /**
     * Direktör görünümü için görevler
     * GET /api/director/tasks/{directorId}
     */
    @GetMapping("/tasks/{directorId}")
    public ResponseEntity<List<GorevDto>> getDirectorTasks(@PathVariable Long directorId) {
        List<GorevDto> tasks = directorService.getDirectorVisibleTasks(directorId);
        return ResponseEntity.ok(tasks);
    }
}

 