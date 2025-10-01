package com.erdemirProje.gorevTakip.dto;

import com.erdemirProje.gorevTakip.entity.GorevYapisi;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GorevDto {
    
    private Long gorevid;
    private String isim;
    private String description;
    private Long userid;
    private String priority;
    private String status;
    private Boolean reportedToDirector;
    private Long assignedById;   // görevi kimin verdiği (User.id)
    private Long parentTaskId;   // child görevler için üst görev id
    
    // Entity'den DTO'ya dönüştürme constructor'ı
    public GorevDto(GorevYapisi entity) {
        this.gorevid = entity.getGorevid();
        this.isim = entity.getIsim();
        this.description = entity.getDescription();
        this.userid = entity.getUserid();
        this.priority = entity.getPriority();
        this.status = entity.getStatus();
        this.reportedToDirector = entity.getReportedToDirector();
        this.assignedById = entity.getAssignedBy() != null ? entity.getAssignedBy().getId() : null;
        this.parentTaskId = entity.getParentTask() != null ? entity.getParentTask().getGorevid() : null;
    }
    
    // DTO'dan Entity'ye dönüştürme metodu
    public GorevYapisi toEntity() {
        GorevYapisi entity = new GorevYapisi();
        entity.setGorevid(this.gorevid);
        entity.setIsim(this.isim);
        entity.setDescription(this.description);
        entity.setUserid(this.userid);
        entity.setPriority(this.priority);
        entity.setStatus(this.status);
        entity.setReportedToDirector(this.reportedToDirector);
        // assignedById ve parentTaskId setter'ları entity tarafında ilişki ile ayarlanır
        return entity;
    }
    
    // Static factory method - Entity'den DTO oluşturma
    public static GorevDto fromEntity(GorevYapisi entity) {
        return new GorevDto(entity);
    }
}
