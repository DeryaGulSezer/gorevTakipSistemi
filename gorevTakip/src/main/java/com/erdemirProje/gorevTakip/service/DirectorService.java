package com.erdemirProje.gorevTakip.service;

import com.erdemirProje.gorevTakip.dto.GorevDto;
import com.erdemirProje.gorevTakip.entity.GorevYapisi;
import com.erdemirProje.gorevTakip.gorevRepo.GorevYapisiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DirectorService {

    private final GorevYapisiRepository gorevRepository;

    /**
     * Direktörün görebileceği görevler: sadece müdürlere atanmış ve child olmayanlar
     * veya bu direktör tarafından atanmış görevler.
     */
    public List<GorevDto> getDirectorVisibleTasks(Long directorId) {
        System.out.println("🔍 DirectorService.getDirectorVisibleTasks çağrıldı - directorId: " + directorId);
        List<GorevYapisi> tasks = gorevRepository.findDirectorVisibleTasks(directorId);
        System.out.println("📊 Bulunan görev sayısı: " + tasks.size());
        for (GorevYapisi task : tasks) {
            System.out.println("📝 Görev: " + task.getIsim() + " - User: " + (task.getUser() != null ? task.getUser().getRole() : "null") + " - AssignedBy: " + (task.getAssignedBy() != null ? task.getAssignedBy().getId() : "null"));
        }
        return tasks.stream().map(GorevDto::fromEntity).collect(Collectors.toList());
    }
}

 