package com.erdemirProje.gorevTakip.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class GorevYapisi {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long gorevid;
    
    private String isim;
    private String description;
    
    // User ile Many-to-One relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userid", referencedColumnName = "id")
    private User user;
    
    private String priority;
    private String status; // "PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED"
    
    @Column(name = "reported_to_director", columnDefinition = "bit default 0")
    private Boolean reportedToDirector = false; // Arşivlenen görevler direktöre rapor edildi mi?

    // Kapsülleme: görevi kim atadı (direktör veya müdür)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_id", referencedColumnName = "id")
    private User assignedBy;

    // Kapsülleme: child görevler için parent göreve referans
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_task_id", referencedColumnName = "gorevid")
    private GorevYapisi parentTask;
    
    // Backward compatibility için userid getter/setter
    public Long getUserid() {
        return user != null ? user.getId() : null;
    }
    
    public void setUserid(Long userid) {
        if (userid != null) {
            User tempUser = new User();
            tempUser.setId(userid);
            this.user = tempUser;
        } else {
            this.user = null;
        }
    }
}
