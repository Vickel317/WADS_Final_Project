1. Project Information

Project Title:
Academify

Project Domain:
Student Community & Collaboration Platform

Class:
COMP6703001 - L4AC

Group Members:
|            Name              |  StudentID   |   Role  |GitHub Name|
|------------------------------|:------------:|:-------:|----------:|
| Vickelsteins August Santoso  | 2802505941   | Coding  | Vickel317 |
| Harris Ekaputra Suryadi      | 2802400502   | Coding  | Harris    |
| Kevin Makmur Kurniawan       | 2802547553   | Coding  | kevMkr    |

2. Instructor & Repository Access

This repository is shared with:

• Instructor: Ida Bagus Kerthyayana Manuaba

o Email: imanuaba@binus.edu

o GitHub: bagzcode

• Instructor Assistant: Juwono

o Email: juwono@binus.edu

o GitHub: Juwono136
3. Project Overview

3.1. Problem Statement

Students usually have trouble to find an environment that supports collaboration. Some of them are incompatible or require payment to collaborate with each other, which can be hard for student. Most websites or application only supports 1 or 2 kinds of files to collaborate with. Thus, this web application is targeting people with an academic background that has an interest in sharing their projects, collaborating, and also accessing more information from other sources, which is from other experienced academic people. Allowing people to collaborate with various file types without changing or moving to another website or web application. The target users would be any student that looks for academic collaboration, student moderator to maintain community standard, and admin to maintain the system. 

3.2 Solution Overview

**Main Features**

Our web application provides an AI powered academic social platform designed to connect students. This platform have some features such as:

1. Discussion Forums
    - Create discussion threads with title, content, and category selection
    - View list of all threads filtered by  topics
    - Add and delete threads
    - Basic search by thread title

2. Secure File Sharing
    - Upload files in discussion thread (PDF,PNG, JPG, JPEG, DOCX)
    - Download files from threads
    - File type and size validation for security

3. Event & Study Session Scheduling
    - Create events with title, description, date/time, and location
    - View list of upcoming events sorted by date
    - View detailed event information

4. User Profiles & Authentication
    - User registration with email, username, password, major, and bio
    - Secure login/logout with JWT authentication

5. Asynchronous Messaging System
    - Send direct messages to other users
    - Reply to messages
    - View inbox showing sender, message preview, and timestamp

6. Role-Based Access Control
    - Three user roles: Student (default), Moderator, Admin
    - Students: Can create and manage their own content
    - Moderators: Can delete any post, review flagged content, manage community
    - Admins: Full platform access, can appoint moderators, manage users


**Why this solution is appropriate**

This platform helps students by solving their collaboration challenges via:
- Centralizing communication: Replacing fragmented tools with one unified platform for discussion
- Ensuring Safety: AI-powered content moderation is used to maintain a respectful and spam free environment
- Facilitating Discovery: Smart topic recommendations and organized categories help students find relevant discussions and study partners effortlessly

**Where AI is Used**

AI functionality is integrated to enchance user experience. AI features that can be expected are:

1. AI-Powered Content Moderation
    - Purpose: To automatically detect and flag inappropriate content, spam, harassment, and policy violations in real-time
    - Implementation: Uses OpenAI Moderation API to analyze all posts, comments, and messages before publication
    - Technology: OpenAI Moderation API with custom threshold configuration
    - Impact: Maintains a safe, respectful academic environment 24/7 without requiring constant human moderator presence

2. Smart topic recommendation
    - Purpose: To personalize the user's feed with topics and discussions that match their academic interests and engagement patterns
    - Implementation: Uses OpenAI Embeddings API to analyze semantic similarity between user interests and available discussion threads, then ranks and displays the most relevant content
    - Technology: OpenAI Embeddings API (text-embedding-3-small model) with cosine similarity matching
    - Impact: Reduces information overload by surfacing relevant academic discussions automatically, helping students discover study groups, course-related threads, and topics aligned with their major without manual searching

---
4. Technology Stack

| Layer | Technology |
| :------ | :----------- |
| Frontend | Next.js |
| Backend | Node.js or Next.js |
| API | REST API |
| Database |PostgreSQL/Firebase |
| Containerization |Docker |
| Deployment | Cloudflare |
| Version Control | Github |

---