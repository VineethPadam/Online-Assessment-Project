package com.example.OnlineAssessment.service;

import com.example.OnlineAssessment.entity.PortalInfo;
import com.example.OnlineAssessment.entity.Founder;
import com.example.OnlineAssessment.entity.Trainer;
import com.example.OnlineAssessment.entity.SuperAdminProfile;
import com.example.OnlineAssessment.entity.ContactMessage;
import com.example.OnlineAssessment.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SuperAdminContentService {

    @Autowired
    private PortalInfoRepository portalInfoRepository;

    @Autowired
    private SuperAdminProfileRepository profileRepository;

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    // Contact Messages
    public ContactMessage saveMessage(ContactMessage msg) {
        if (msg == null)
            return null;
        return contactMessageRepository.save(msg);
    }

    public List<ContactMessage> getAllMessages() {
        return contactMessageRepository.findAll();
    }

    public void deleteMessage(Long id) {
        if (id != null) {
            contactMessageRepository.deleteById(id);
        }
    }

    // Super Admin Profile
    public SuperAdminProfile getProfile() {
        return profileRepository.findAll().stream().findFirst().orElse(new SuperAdminProfile());
    }

    public SuperAdminProfile saveProfile(SuperAdminProfile profile) {
        if (profile == null)
            return null;
        profileRepository.findAll().stream().findFirst().ifPresent(existing -> {
            profile.setId(existing.getId());
        });
        return profileRepository.save(profile);
    }

    // Portal Info
    public PortalInfo getPortalInfo() {
        return portalInfoRepository.findAll().stream().findFirst().orElse(new PortalInfo());
    }

    public PortalInfo savePortalInfo(PortalInfo info) {
        if (info == null)
            return null;
        portalInfoRepository.findAll().stream().findFirst().ifPresent(existing -> {
            info.setId(existing.getId());
        });
        return portalInfoRepository.save(info);
    }
}
