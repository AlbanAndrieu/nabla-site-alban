# Workstation Reference Documentation

**Owner:** Alban Andrieu\
**Hostname:** albandrieu\
**Purpose:** Development • DevSecOps • AI • Homelab\
**Last Updated:** 2026-07-09

------------------------------------------------------------------------

# 1. Hardware

## Motherboard

  Component   Value
  ----------- ------------------------------
  Model       ASUS ROG STRIX Z390-E Gaming
  Chipset     Intel Z390
  BIOS        AMI 2102
  BIOS Date   2024-05-03

## CPU

  Item              Value
  ----------------- ---------------------
  Processor         Intel Core i7-9700K
  Architecture      Coffee Lake Refresh
  Cores / Threads   8 / 8
  Signature         0x000906ed
  Microcode         0x104
  Base Clock        3.6 GHz
  Turbo             4.6 GHz

Observed: - Stable turbo around **4.6 GHz** - No Machine Check
Exceptions - No thermal throttling - No RAS errors

------------------------------------------------------------------------

## Memory

  Item       Value
  ---------- -----------------------------
  Capacity   64 GB
  Layout     4 × 16 GB
  Model      Corsair CMW64GX4M4C3200C16
  Type       DDR4
  XMP        3200 MT/s
  Current    2133 MT/s (JEDEC safe mode)

Current decision:

> XMP intentionally disabled while workstation stability is being
> validated.

------------------------------------------------------------------------

## GPU

  Item           Value
  -------------- -------------------------
  GPU            NVIDIA RTX 2060
  GPU Codename   TU106
  Driver         595.71.05
  OpenGL         NVIDIA GeForce RTX 2060
  Vulkan         Enabled
  CUDA           Available

Current observations

-   GPU healthy
-   No Xid
-   No thermal issues

------------------------------------------------------------------------

## Power Supply

ASUS ROG Thor 1200W

------------------------------------------------------------------------

# Storage

## NVMe

Samsung PM981 / SM981

Logical Volumes

-   /
-   /workspace
-   Docker

## SATA

LVM RAID1

Mounted

-   /data

Status

-   Healthy
-   100% synchronized

------------------------------------------------------------------------

# Filesystems

    LUKS
     └── LVM
          ├── /
          ├── Docker
          └── Workspace

    LVM RAID1
     └── /data

------------------------------------------------------------------------

# Network

Intel I219-V

Bluetooth

CSR USB Bluetooth

------------------------------------------------------------------------

# USB

-   Logitech Unifying
-   Logitech C310 (x2)
-   Plantronics Blackwire C5220
-   YubiKey 4/5
-   ASUS Aura
-   SanDisk Ultra

------------------------------------------------------------------------

# Software

Operating System

Ubuntu 26.04 LTS

Kernel

7.0.0-27-generic

Docker

-   overlay2
-   Buildx
-   Docker Compose

AI

-   Ollama
-   LiteLLM
-   OpenWebUI
-   Langfuse

Development

-   OpenTofu
-   Kubernetes
-   Nomad
-   Docker
-   Git
-   Python

------------------------------------------------------------------------

# BIOS Stable Configuration

## Enabled

-   Intel Turbo Boost
-   VT-x
-   VT-d
-   UEFI
-   Secure Boot (optional)

## Disabled

-   ASUS MultiCore Enhancement
-   Manual Overclock

## Current

-   AI Overclock Tuner = Auto
-   CPU Ratio = Auto
-   CPU Current Capability = Auto
-   Memory = JEDEC 2133 MT/s

------------------------------------------------------------------------

# Benchmark Baseline

CPU

-   Turbo: 4.6 GHz
-   Temperature: \<75°C

RAM

-   64 GB

GPU

-   RTX2060

Storage

-   NVMe + SATA RAID1


------------------------------------------------------------------------

# Related Scripts

-   check-workstation.sh
-   check-workstation-disk.sh
-   check-workstation-cpu.sh
-   healthcheck containers
-   SMART monitoring
-   LVM monitoring
-   Docker monitoring

------------------------------------------------------------------------

# Change Log

## 2026-07

-   Fixed RAM configuration
-   Stabilized BIOS
-   Added CPU stability checks
-   Added LVM RAID monitoring
-   Added storage health monitoring
-   Added Docker regression checks
