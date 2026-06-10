import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor

# Custom Page Templates for Header & Footer
def draw_cover_page(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica-Bold', 8)
    canvas.setFillColor(HexColor('#4f46e5'))
    canvas.drawString(54, 738, "LAWMATE PLATFORM DOCUMENTATION")
    
    canvas.setStrokeColor(HexColor('#e2e8f0'))
    canvas.setLineWidth(1)
    canvas.line(54, 728, 558, 728)
    
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(HexColor('#64748b'))
    canvas.drawString(54, 54, "CONFIDENTIAL - FOR INTERNAL USE ONLY")
    canvas.drawRightString(558, 54, "Version 1.1.0")
    canvas.restoreState()

def draw_later_page(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(HexColor('#64748b'))
    canvas.drawString(54, 738, "LawMate / LawOnCall Full-Stack - Production Deployment Guide (AWS)")
    
    canvas.setStrokeColor(HexColor('#e2e8f0'))
    canvas.setLineWidth(0.5)
    canvas.line(54, 730, 558, 730)
    
    canvas.drawString(54, 54, "CONFIDENTIAL - INTERNAL DEPLOYMENT DOCUMENT")
    page_num = canvas.getPageNumber()
    canvas.drawRightString(558, 54, f"Page {page_num}")
    canvas.restoreState()

def build_pdf():
    pdf_path = "AWS_Deployment_Guide.pdf"
    
    # Page setup: letter size is 612 x 792 points. 0.75-inch margin = 54 points. Printable width = 504 points.
    doc = SimpleDocTemplate(
        pdf_path, 
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette Colors
    PRIMARY = HexColor('#1e293b') # Slate 800
    ACCENT = HexColor('#4f46e5')  # Indigo 600
    TEXT_COLOR = HexColor('#334155') # Slate 700
    BG_LIGHT = HexColor('#f8fafc') # Slate 50
    BORDER_COLOR = HexColor('#cbd5e1') # Slate 300
    
    # Modify default styles
    styles['Normal'].textColor = TEXT_COLOR
    styles['Normal'].fontSize = 9.5
    styles['Normal'].leading = 14
    
    # Custom Heading & Text Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=PRIMARY,
        spaceAfter=15,
        spaceBefore=120
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontSize=12,
        leading=18,
        textColor=HexColor('#64748b'),
        spaceAfter=180
    )
    
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontSize=10,
        leading=16,
        textColor=TEXT_COLOR
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=PRIMARY,
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=ACCENT,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    
    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        spaceAfter=8
    )
    
    list_style = ParagraphStyle(
        'List_Custom',
        parent=styles['Normal'],
        leftIndent=20,
        firstLineIndent=-10,
        spaceAfter=6
    )
    
    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=HexColor('#0f172a')
    )
    
    callout_style = ParagraphStyle(
        'Callout_Custom',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=HexColor('#c2410c') # Rust Orange/Red
    )

    story = []

    # ================= PAGE 1: COVER PAGE =================
    story.append(Paragraph("LAWONCALL PLATFORM", ParagraphStyle('CoverPre', parent=styles['Normal'], fontSize=11, fontName='Helvetica-Bold', textColor=ACCENT, spaceAfter=10)))
    story.append(Paragraph("AWS Production Deployment Guide", title_style))
    story.append(Paragraph("A comprehensive, step-by-step documentation for deploying the LawMate Full-Stack application (React PWA Frontend, Fastify Microservices Gateway, and PostgreSQL Database) on Amazon Web Services. Written for both technical administrators and non-technical managers.", subtitle_style))
    
    meta_data = [
        [Paragraph("<b>Status:</b>", meta_style), Paragraph("Production-Ready / Deployed", meta_style)],
        [Paragraph("<b>Last Updated:</b>", meta_style), Paragraph("June 10, 2026", meta_style)],
        [Paragraph("<b>Version:</b>", meta_style), Paragraph("1.1.0 (Detailed Edition)", meta_style)],
        [Paragraph("<b>Author:</b>", meta_style), Paragraph("Antigravity Dev Team", meta_style)]
    ]
    t_meta = Table(meta_data, colWidths=[1.2*inch, 4*inch])
    t_meta.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_meta)
    story.append(PageBreak())

    # ================= PAGE 2: SYSTEM ARCHITECTURE OVERVIEW =================
    story.append(Paragraph("1. System Architecture Overview", h1_style))
    story.append(Paragraph(
        "The LawMate (LawOnCall) application is a decoupled, modern multi-service system. It is composed of a single-page PWA client (React/Vite) and six backend microservices (Gateway, Auth, Lead, Payment, Notification, and Profile) coordinated behind an API Gateway proxy. Native AWS services are leveraged to ensure high availability, fast response times, database backups, and SSL security.",
        body_style
    ))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Components and Target AWS Services:</b>", h2_style))
    
    # Table Width must be exactly 504 points (7 inches)
    table_headers = [
        Paragraph("<b>Component / Port</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', textColor=HexColor('#ffffff'))),
        Paragraph("<b>Folder / Repo</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', textColor=HexColor('#ffffff'))),
        Paragraph("<b>AWS Target</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', textColor=HexColor('#ffffff'))),
        Paragraph("<b>Purpose & Access</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', textColor=HexColor('#ffffff'))),
    ]
    
    table_rows = [
        table_headers,
        [
            Paragraph("Client App<br/><font color='#64748b'>Port: 80/443 (via CDN)</font>", body_style),
            Paragraph("<code>lawmate-pwa</code>", body_style),
            Paragraph("S3 + CloudFront + ACM", body_style),
            Paragraph("Builds React JS/CSS files and distributes globally via S3 & CDN under HTTPS.", body_style)
        ],
        [
            Paragraph("API Gateway<br/><font color='#64748b'>Port: 8000 (Public)</font>", body_style),
            Paragraph("<code>services/gateway</code>", body_style),
            Paragraph("EC2 / ECS Fargate + ALB", body_style),
            Paragraph("Entrypoint route for all client API queries. Validates JWT and proxies requests.", body_style)
        ],
        [
            Paragraph("Auth Service<br/><font color='#64748b'>Port: 3001 (Internal)</font>", body_style),
            Paragraph("<code>services/auth</code>", body_style),
            Paragraph("EC2 / ECS (Internal)", body_style),
            Paragraph("Handles user sign-in, Firebase JWT verification, and email OTP codes.", body_style)
        ],
        [
            Paragraph("Lead Service<br/><font color='#64748b'>Port: 3002 (Internal)</font>", body_style),
            Paragraph("<code>services/lead</code>", body_style),
            Paragraph("EC2 / ECS (Internal)", body_style),
            Paragraph("Runs automated lawyer matching logic and SLA background timers.", body_style)
        ],
        [
            Paragraph("Payment Service<br/><font color='#64748b'>Port: 3003 (Internal)</font>", body_style),
            Paragraph("<code>services/payment</code>", body_style),
            Paragraph("EC2 / ECS (Internal)", body_style),
            Paragraph("Processes Razorpay & PhonePe callback webhooks and transaction states.", body_style)
        ],
        [
            Paragraph("Notification Service<br/><font color='#64748b'>Port: 3004 (Internal)</font>", body_style),
            Paragraph("<code>services/notification</code>", body_style),
            Paragraph("EC2 / ECS (Internal)", body_style),
            Paragraph("Sends push notifications (Firebase), WhatsApp alerts, and logs SMS.", body_style)
        ],
        [
            Paragraph("Profile Service<br/><font color='#64748b'>Port: 3005 (Internal)</font>", body_style),
            Paragraph("<code>services/profile</code>", body_style),
            Paragraph("EC2 / ECS (Internal)", body_style),
            Paragraph("Manages user advocate profiles, ratings, and profile updates.", body_style)
        ],
        [
            Paragraph("Database<br/><font color='#64748b'>Port: 5432 (Isolated)</font>", body_style),
            Paragraph("<code>packages/db</code>", body_style),
            Paragraph("AWS RDS PostgreSQL", body_style),
            Paragraph("Managed PostgreSQL database with automatic backups and failovers.", body_style)
        ]
    ]
    
    col_widths = [1.1*inch, 1.2*inch, 1.6*inch, 3.1*inch]
    t_arch = Table(table_rows, colWidths=col_widths, repeatRows=1)
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HexColor('#1e293b')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#ffffff'), HexColor('#f8fafc')])
    ]))
    story.append(t_arch)
    
    story.append(Spacer(1, 20))
    story.append(Paragraph("2. Identity and Access Management (IAM) Configuration", h1_style))
    story.append(Paragraph(
        "AWS IAM (Identity and Access Management) allows us to create secure, restricted access keys for deploying code to AWS without sharing our master root account. Follow these visual console clicks exactly to create a deployer user:",
        body_style
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Step-by-Step Deployer IAM User Creation:</b>", h2_style))
    story.append(Paragraph("1. Open a new web browser tab, go to <b>https://aws.amazon.com/console</b>, and click <b>Sign In to the Console</b> in the top right corner. Select <b>Root User</b>, enter your administrator email address, enter your password, and complete any multi-factor authentication (MFA) prompts.", list_style))
    story.append(Paragraph("2. Once logged in, locate the search bar at the very top center of the console window. Type <b>IAM</b>. Click the first matching service named <b>IAM</b> (Manage access to AWS resources).", list_style))
    story.append(Paragraph("3. On the left-side navigation sidebar, locate the <b>Access management</b> drop-down menu and click on <b>Users</b>.", list_style))
    story.append(Paragraph("4. Click the orange <b>Create user</b> button located in the top-right corner of the screen.", list_style))
    story.append(Paragraph("5. **Step 1 (Specify user details)**: In the <b>User name</b> input text field, type <code>lawmate-deployer</code>. Ensure the checkbox for 'Provide user access to the AWS Management Console' remains <b>UNCHECKED</b> (this account is purely for programmatic developer/CI-CD access, not web logins). Click the orange <b>Next</b> button.", list_style))
    story.append(Paragraph("6. **Step 2 (Set permissions)**: Under **Permissions options**, click the third card labeled <b>Attach policies directly</b>.", list_style))
    story.append(Paragraph("7. In the **Permissions policies** table search box, type each of the following policy names one-by-one and check the selection box on the left of each row:", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• <code>AmazonEC2ContainerRegistryFullAccess</code> (Allows pushing docker images to AWS ECR)", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• <code>AmazonECS_FullAccess</code> (Allows management of Fargate containerized services)", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• <code>AmazonS3FullAccess</code> (Required to write and delete client build assets in S3 buckets)", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• <code>CloudFrontFullAccess</code> (Allows invalidating and refreshing CDN caches globally)", list_style))
    story.append(Paragraph("8. Click the orange <b>Next</b> button at the bottom-right. Review the user details and click <b>Create user</b>.", list_style))
    story.append(Paragraph("9. On the Users list table, find and click on the blue text name <code>lawmate-deployer</code> that you just created.", list_style))
    story.append(Paragraph("10. Click on the <b>Security credentials</b> tab in the middle of the screen.", list_style))
    story.append(Paragraph("11. Scroll down to the section titled **Access keys** and click the button labeled <b>Create access key</b>.", list_style))
    story.append(Paragraph("12. Select the first radio option labeled <b>Command Line Interface (CLI)</b>. Scroll down, check the acknowledgment box confirming you understand the alternatives, and click <b>Next</b>.", list_style))
    story.append(Paragraph("13. Leave the Description tag blank, then click the orange <b>Create access key</b> button.", list_style))
    story.append(Paragraph("14. **CRITICAL ACTION REQUIRED:** You will see a screen displaying `Access key` and `Secret access key`. Click the gray <b>Download .csv file</b> button in the bottom left. Store this file securely; you cannot retrieve this secret key again once you leave this page.", list_style))
    
    story.append(PageBreak())

    # ================= PAGE 3: DATABASE PROVISIONING =================
    story.append(Paragraph("3. Relational Database Service (RDS) Provisioning", h1_style))
    story.append(Paragraph(
        "AWS RDS handles our managed PostgreSQL instance, ensuring regular automated daily backups, automatic database OS patching, and storage scaling.",
        body_style
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Step-by-Step RDS PostgreSQL Cluster Setup:</b>", h2_style))
    story.append(Paragraph("1. In the top console search bar, type <b>RDS</b> and select the RDS service from the results.", list_style))
    story.append(Paragraph("2. On the RDS dashboard, click the orange <b>Create database</b> button.", list_style))
    story.append(Paragraph("3. Choose a database creation method: Click the radio button for <b>Standard create</b> (allows custom network settings).", list_style))
    story.append(Paragraph("4. Engine options: Select **PostgreSQL**.", list_style))
    story.append(Paragraph("5. Engine version: Select the default stable version, **PostgreSQL 16.1 or newer**.", list_style))
    story.append(Paragraph("6. Templates: Select **Production** for live company deployment. *(For testing or staging, you may select Free Tier to minimize billing).* ", list_style))
    story.append(Paragraph("7. Settings details:", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• **DB instance identifier**: Type <code>lawoncall-prod-db</code>.", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• **Master username**: Enter <code>postgres</code>.", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• **Credentials management**: Select **Self managed**. Type a strong master password in the fields and write it down in a secure credentials manager.", list_style))
    story.append(Paragraph("8. Instance configuration: Choose **Burstable classes** and select `db.t4g.medium` (2 vCPUs, 4 GiB memory, cost-effective ARM-based machine suitable for live loads).", list_style))
    story.append(Paragraph("9. Storage details:", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• Storage type: Select **gp3** (General Purpose SSD, offers best balance of speed and cost).", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• Allocated storage: Set to **20 GiB** (minimum threshold).", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• Keep **Enable storage autoscaling** checked, and set the **Maximum storage threshold** to **100 GiB**.", list_style))
    story.append(Paragraph("10. Connectivity details:", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• **Virtual Private Cloud (VPC)**: Select the default VPC or your production VPC.", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• **Public access**: Select **No**. *(This isolates the database inside the private network so hacker scanners cannot scan port 5432).* ", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• **VPC security group**: Select **Create new**. Type the name <code>lawoncall-rds-sg</code> in the text field.", list_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;• **Database port**: Leave set to **5432**.", list_style))
    story.append(Paragraph("11. Click the orange <b>Create database</b> button at the bottom. The database instance status will show as 'Creating'. Wait 5–10 minutes until it changes to a green **Available** status.", list_style))
    story.append(Paragraph("12. Click on the name <code>lawoncall-prod-db</code>. Under the **Connectivity & security** tab, copy the value under **Endpoint** (e.g. <code>lawoncall-prod-db.xxxxxx.ap-south-1.rds.amazonaws.com</code>). This is your database server address.", list_style))
    
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Step-by-Step Security Group Rules Config:</b>", h2_style))
    story.append(Paragraph("To allow your backend server to connect to this database, we must modify the database firewall rules:", list_style))
    story.append(Paragraph("1. In RDS console -> Click on <code>lawoncall-prod-db</code>. Under the **Connectivity & security** tab, look at the **VPC security groups** section. Click on the link for <code>lawoncall-rds-sg</code>.", list_style))
    story.append(Paragraph("2. You will be redirected to the Security Groups screen. Select the checkbox for <code>lawoncall-rds-sg</code>.", list_style))
    story.append(Paragraph("3. In the lower half of the screen, click the **Inbound rules** tab, then click the **Edit inbound rules** button.", list_style))
    story.append(Paragraph("4. Click **Add rule**.", list_style))
    story.append(Paragraph("5. Under **Type**, choose **PostgreSQL (Port 5432)**.", list_style))
    story.append(Paragraph("6. Under **Source**, select **Custom**. In the text field, start typing the security group of your EC2 backend server (usually named something like <code>launch-wizard-1</code> or <code>lawoncall-ec2-sg</code>) and select it. Alternatively, type the VPC CIDR range (e.g. <code>172.31.0.0/16</code>) to allow any internal server in the private subnet to connect.", list_style))
    story.append(Paragraph("7. Click the orange **Save rules** button.", list_style))
    
    # Callout Warning block
    warning_data = [[
        Paragraph(
            "<b>SECURITY WARNING:</b> Never open database access port 5432 to <code>0.0.0.0/0</code> (the entire internet). This exposes the database to brute force attempts. You must restrict port 5432 inbound connections exclusively to the security group assigned to your backend EC2 instance or ECS Fargate task.",
            callout_style
        )
    ]]
    t_warning = Table(warning_data, colWidths=[7.0*inch])
    t_warning.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#fff7ed')), # Orange-50 tint
        ('BOX', (0,0), (-1,-1), 1, HexColor('#fed7aa')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t_warning)

    story.append(PageBreak())

    # ================= DATABASE MIGRATION =================
    story.append(Paragraph("3.2: Running Database Schema Migration", h2_style))
    story.append(Paragraph(
        "To initialize the tables inside the RDS PostgreSQL instance, you must execute the Prisma migration tool. This will look at the schema definition in the project files and automatically generate tables, indexes, and relations inside your blank database.",
        body_style
    ))
    story.append(Paragraph("1. Open the command terminal on your local system (Command Prompt on Windows, Terminal on Mac/Linux).", list_style))
    story.append(Paragraph("2. Navigate to the folder where you have downloaded the project: <code>cd /path/to/Lawmate</code>", list_style))
    story.append(Paragraph("3. Set the database URL variable in your terminal session, substituting the database endpoint and master password you wrote down in Section 3:", list_style))
    
    # Code block
    code_migration = [
        [Paragraph("# For Windows Command Prompt (cmd):", code_style)],
        [Paragraph("set DATABASE_URL=\"postgresql://postgres:YOUR_PASSWORD@rds-endpoint.amazonaws.com:5432/neondb?sslmode=require\"", code_style)],
        [Paragraph("# For Windows PowerShell:", code_style)],
        [Paragraph("$env:DATABASE_URL=\"postgresql://postgres:YOUR_PASSWORD@rds-endpoint.amazonaws.com:5432/neondb?sslmode=require\"", code_style)],
        [Paragraph("# For Mac or Linux Terminal:", code_style)],
        [Paragraph("export DATABASE_URL=\"postgresql://postgres:YOUR_PASSWORD@rds-endpoint.amazonaws.com:5432/neondb?sslmode=require\"", code_style)]
    ]
    t_migration = Table(code_migration, colWidths=[7.0*inch])
    t_migration.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_migration)
    
    story.append(Spacer(1, 8))
    story.append(Paragraph("4. Navigate to the database utility package: <code>cd packages/db</code>", list_style))
    story.append(Paragraph("5. Run the push command: <code>npx prisma db push</code>. Wait for the terminal to print <code>✔ Your database is now in sync with your Prisma schema.</code>", list_style))

    story.append(PageBreak())

    # ================= PAGE 4: FRONTEND DEPLOYMENT =================
    story.append(Paragraph("4. Frontend Deployment (AWS S3 + CloudFront + ACM)", h1_style))
    story.append(Paragraph(
        "The React PWA frontend (single-page application) is built into static assets (HTML, JS, CSS) and hosted on AWS S3, while CloudFront acts as a global CDN to distribute files under HTTPS with minimum latency.",
        body_style
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Step 4.1: Build React Assets locally:</b>", h2_style))
    story.append(Paragraph("1. Create an <code>.env.production</code> file inside the <code>lawmate-pwa</code> directory using Notepad (Windows) or TextEdit (Mac).", list_style))
    story.append(Paragraph("2. Paste your production environment configuration (Vite requires variables to be prefixed with <code>VITE_</code>):", list_style))
    
    code_env_prod = [
        [Paragraph("VITE_API_URL=https://api.yourdomain.com", code_style)],
        [Paragraph("VITE_FIREBASE_API_KEY=AIzaSyA123456789...", code_style)],
        [Paragraph("VITE_FIREBASE_AUTH_DOMAIN=lawmate-prod.firebaseapp.com", code_style)],
        [Paragraph("VITE_FIREBASE_PROJECT_ID=lawmate-prod", code_style)],
        [Paragraph("VITE_FIREBASE_STORAGE_BUCKET=lawmate-prod.appspot.com", code_style)],
        [Paragraph("VITE_FIREBASE_MESSAGING_SENDER_ID=8877665544", code_style)],
        [Paragraph("VITE_FIREBASE_APP_ID=1:8877665544:web:abcd1234ef", code_style)]
    ]
    t_env_prod = Table(code_env_prod, colWidths=[7.0*inch])
    t_env_prod.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_env_prod)
    
    story.append(Spacer(1, 5))
    story.append(Paragraph("3. Open your terminal, navigate to the PWA folder, and compile the static build:", list_style))
    
    code_build = [
        [Paragraph("cd lawmate-pwa", code_style)],
        [Paragraph("npm install", code_style)],
        [Paragraph("npm run build  # This outputs all static files in the lawmate-pwa/dist/ folder", code_style)]
    ]
    t_build = Table(code_build, colWidths=[7.0*inch])
    t_build.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_build)
    
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Step 4.2: Create and Configure S3 Bucket:</b>", h2_style))
    story.append(Paragraph("1. Open S3 console and click <b>Create bucket</b>.", list_style))
    story.append(Paragraph("2. Bucket Name: Enter a unique name (e.g. <code>lawmate-pwa-prod-bucket</code>). Select your deployment Region.", list_style))
    story.append(Paragraph("3. Under <b>Block Public Access settings for this bucket</b>, make sure <b>Block all public access</b> is <b>checked</b>. (This ensures files are served only through the CloudFront CDN securely). Click <b>Create bucket</b>.", list_style))
    story.append(Paragraph("4. Uploading assets step-by-step: Click on the name of the bucket <code>lawmate-pwa-prod-bucket</code> from the S3 list. Click the <b>Upload</b> button. Click the **Add files** button, select all files inside the local <code>lawmate-pwa/dist/</code> directory, and click open. Click the **Add folder** button, select the <code>assets</code> folder inside <code>lawmate-pwa/dist/</code>, and click open. Click the orange **Upload** button at the bottom of the page and wait for the green bar.", list_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Step 4.3: Request SSL Certificate (ACM):</b>", h2_style))
    story.append(Paragraph("To enable secure HTTPS encryption for the frontend, we must request a certificate:", list_style))
    story.append(Paragraph("1. In AWS Console search bar, type <b>Certificate Manager</b> and click on it.", list_style))
    story.append(Paragraph("2. Click **Request certificate** in the top right. Select **Request a public certificate**, then click **Next**.", list_style))
    story.append(Paragraph("3. **Fully qualified domain name**: Enter `www.yourdomain.com`. Click **Add another name** and enter `yourdomain.com`.", list_style))
    story.append(Paragraph("4. Select **DNS validation** as the validation method and click **Request**.", list_style))
    story.append(Paragraph("5. Refresh the certificates list, click on the ID of your request, and scroll down to the **Domains** section. Copy the CNAME Name and CNAME Value, and add them as a CNAME record at your domain provider (e.g., GoDaddy, Namecheap) to prove ownership. Once done, the status will turn to a green **Issued**.", list_style))
    
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Step 4.4: Configure CloudFront Distribution:</b>", h2_style))
    story.append(Paragraph("1. Open CloudFront console, click <b>Create distribution</b>.", list_style))
    story.append(Paragraph("2. Origin Domain: Select your S3 bucket (e.g., <code>lawmate-pwa-prod-bucket.s3.amazonaws.com</code>).", list_style))
    story.append(Paragraph("3. Origin Access: Select <b>Origin Access Control (OAC)</b>. Click <b>Create control setting</b>, accept defaults, and click <b>Create</b>.", list_style))
    story.append(Paragraph("4. Viewer Protocol Policy: Select <b>Redirect HTTP to HTTPS</b>.", list_style))
    story.append(Paragraph("5. Web Application Firewall (WAF): Select <b>Do not enable security protections</b> for basic setup, or enable it for DDoS guard.", list_style))
    story.append(Paragraph("6. SSL Certificate & Domain: Under <b>Alternate domain name (CNAME)</b>, enter your domain name (e.g., <code>www.yourdomain.com</code>). Under <b>Custom SSL certificate</b>, select your requested ACM certificate.", list_style))
    story.append(Paragraph("7. Default Root Object: Type <code>index.html</code>. Click <b>Create distribution</b>.", list_style))
    story.append(Paragraph("8. **CRITICAL STEP (Link S3 and CDN)**: Once created, a yellow alert bar will appear at the top saying: 'The S3 bucket policy needs to be updated'. Click the **Copy policy** button. Go to your S3 bucket's **Permissions** tab, scroll to **Bucket policy**, click **Edit**, paste the policy, and click **Save changes**.", list_style))
    story.append(Paragraph("9. **CRITICAL React Router Configuration**: In the CloudFront console under your distribution, go to the **Error pages** tab. Click **Create custom error response**. For HTTP Error Code, select **404: Not Found**. Select **Customize Error Response** -> **Yes**. Set Response Page Path to <code>/index.html</code> and HTTP Response Code to <b>200: OK</b>. Click **Create**.", list_style))
    
    story.append(PageBreak())

    # ================= PAGE 5: BACKEND DEPLOYMENT =================
    story.append(Paragraph("5. Cost-Effective Backend EC2 Deployment", h1_style))
    story.append(Paragraph(
        "For cost-efficiency, ease of setup, and single-instance management, we deploy the Fastify Gateway API and microservices on a single AWS EC2 instance orchestrated via Docker Compose and served behind an Nginx reverse proxy with SSL.",
        body_style
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Step 5.1: Provision EC2 Instance:</b>", h2_style))
    story.append(Paragraph("1. Open the EC2 dashboard, click <b>Launch instance</b>.", list_style))
    story.append(Paragraph("2. Instance name: <code>lawmate-backend-server</code>. OS: Select <b>Ubuntu Server 22.04 LTS</b>.", list_style))
    story.append(Paragraph("3. Instance Type: Select <code>t3.medium</code> (2 vCPUs, 4 GiB memory) to handle running all microservices smoothly.", list_style))
    story.append(Paragraph("4. Key Pair: Select an existing key pair or click <b>Create new key pair</b>. Download the <code>.pem</code> file and keep it secure on your system.", list_style))
    story.append(Paragraph("5. Network Settings: Check the boxes for <b>Allow SSH traffic from</b>, <b>Allow HTTPS traffic from the internet</b>, and <b>Allow HTTP traffic from the internet</b>.", list_style))
    story.append(Paragraph("6. Click <b>Launch instance</b>.", list_style))
    story.append(Paragraph("7. <b>Allocate Elastic IP:</b> On the EC2 sidebar, select <b>Elastic IPs</b>, click <b>Allocate Elastic IP address</b>. Select the allocated IP, click <b>Actions</b> -> <b>Associate Elastic IP address</b>, and select your running <code>lawmate-backend-server</code> instance. (This ensures the IP address stays constant after restarts).", list_style))
    
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Step 5.2: Connect to the Server & Install Software:</b>", h2_style))
    story.append(Paragraph("1. In the EC2 instances list, select <code>lawmate-backend-server</code> and click the <b>Connect</b> button at the top.", list_style))
    story.append(Paragraph("2. Under the <b>EC2 Instance Connect</b> tab, click the orange <b>Connect</b> button. (This opens a secure server command line terminal directly in your web browser, removing the need for any SSH client software!).", list_style))
    story.append(Paragraph("3. Once the command prompt appears, copy and paste the following commands to install Node.js 20, Docker, Docker Compose, Git, Nginx, and Certbot:", list_style))
    
    code_install = [
        [Paragraph("# Setup nodesource Node.js repository and install required tools", code_style)],
        [Paragraph("curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -", code_style)],
        [Paragraph("sudo apt-get update", code_style)],
        [Paragraph("sudo apt-get install -y nodejs docker.io docker-compose git certbot python3-certbot-nginx", code_style)]
    ]
    t_install = Table(code_install, colWidths=[7.0*inch])
    t_install.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_install)
    
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Step 5.3: Set Up Project Files & Dependencies:</b>", h2_style))
    story.append(Paragraph("1. Create the application folder under <code>/app</code> on the EC2 server and grant ownership permissions to the current user (ubuntu):", list_style))
    
    code_dir_setup = [
        [Paragraph("sudo mkdir -p /app", code_style)],
        [Paragraph("sudo chown -R ubuntu:ubuntu /app", code_style)]
    ]
    t_dir_setup = Table(code_dir_setup, colWidths=[7.0*inch])
    t_dir_setup.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_dir_setup)
    
    story.append(Paragraph("2. Clone the Git repository of the project into the <code>/app/lawmate</code> directory:", list_style))
    
    code_clone = [
        [Paragraph("git clone https://github.com/codeamanwal/Lawmate.git /app/lawmate", code_style)],
        [Paragraph("cd /app/lawmate", code_style)]
    ]
    t_clone = Table(code_clone, colWidths=[7.0*inch])
    t_clone.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_clone)

    story.append(Paragraph("3. Create the <code>.env</code> environment file inside the project directory: <code>nano .env</code>. (Paste the configuration checklist from Section 6, replacing placeholders with your actual secrets). Paste using right-click in browser terminal. Press <code>Ctrl+O</code> to save, press <code>Enter</code> to confirm file name, and then press <code>Ctrl+X</code> to exit the nano editor.", list_style))
    story.append(Paragraph("4. Install all project dependencies recursively for all microservices (this handles standard compilation for the host OS environment):", list_style))
    
    code_npm_install = [
        [Paragraph("npm run install:all", code_style)]
    ]
    t_npm_install = Table(code_npm_install, colWidths=[7.0*inch])
    t_npm_install.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_npm_install)

    story.append(Paragraph("5. Generate the database Prisma Client models and push the database schema directly to your RDS instance:", list_style))
    
    code_db_push = [
        [Paragraph("npm run db:generate", code_style)],
        [Paragraph("npm run db:push", code_style)]
    ]
    t_db_push = Table(code_db_push, colWidths=[7.0*inch])
    t_db_push.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_db_push)

    story.append(Paragraph("6. Create the <code>docker-compose.yml</code> file: <code>nano docker-compose.yml</code>. Paste the configuration template shown on the next page, then press <code>Ctrl+O</code> to save, press <code>Enter</code> to confirm file name, and then press <code>Ctrl+X</code> to exit.", list_style))
    story.append(Paragraph("7. Start all backend microservices using Docker Compose: <code>sudo docker-compose up -d</code>. (This downloads Node.js, mounts the local files, and launches all microservices in the background). Verify status with: <code>sudo docker-compose ps</code>.", list_style))
    
    story.append(PageBreak())

    # ================= PAGE 6: DOCKER COMPOSE CONFIGURATION =================
    story.append(Paragraph("5.4: docker-compose.yml Production Template", h2_style))
    story.append(Paragraph(
        "This configuration launches all the LawMate microservices on the EC2 instance, using network_mode: 'host' for optimal performance and cross-service communication.",
        body_style
    ))
    story.append(Spacer(1, 5))
    
    docker_compose_code = """version: '3.8'

services:
  gateway:
    image: node:20
    working_dir: /app
    volumes:
      - .:/app
    command: npx tsx services/gateway/index.ts
    network_mode: "host"
    environment:
      - PORT=8000
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
      - AUTH_SERVICE=http://127.0.0.1:3001
      - LEAD_SERVICE=http://127.0.0.1:3002
      - PROFILE_SERVICE=http://127.0.0.1:3005
      - PAYMENT_SERVICE=http://127.0.0.1:3003
      - NOTIFICATION_SERVICE=http://127.0.0.1:3004
    restart: always

  auth:
    image: node:20
    working_dir: /app
    volumes:
      - .:/app
    command: npx tsx services/auth/index.ts
    network_mode: "host"
    environment:
      - PORT=3001
      - DATABASE_URL=${DATABASE_URL}
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    restart: always

  lead:
    image: node:20
    working_dir: /app
    volumes:
      - .:/app
    command: npx tsx services/lead/index.ts
    network_mode: "host"
    environment:
      - PORT=3002
      - DATABASE_URL=${DATABASE_URL}
      - EXOTEL_API_KEY=${EXOTEL_API_KEY}
      - EXOTEL_API_TOKEN=${EXOTEL_API_TOKEN}
      - EXOTEL_ACCOUNT_SID=${EXOTEL_ACCOUNT_SID}
      - EXOTEL_SUBDOMAIN=${EXOTEL_SUBDOMAIN}
      - EXOTEL_EXOPHONE=${EXOTEL_EXOPHONE}
      - EXOTEL_STATUS_CALLBACK_URL=${EXOTEL_STATUS_CALLBACK_URL}
    restart: always

  payment:
    image: node:20
    working_dir: /app
    volumes:
      - .:/app
    command: npx tsx services/payment/index.ts
    network_mode: "host"
    environment:
      - PORT=3003
      - DATABASE_URL=${DATABASE_URL}
      - PHONEPE_CLIENT_ID=${PHONEPE_CLIENT_ID}
      - PHONEPE_CLIENT_SECRET=${PHONEPE_CLIENT_SECRET}
      - PHONEPE_CLIENT_VERSION=${PHONEPE_CLIENT_VERSION}
      - PHONEPE_ENV=${PHONEPE_ENV}
      - PHONEPE_WEBHOOK_USERNAME=${PHONEPE_WEBHOOK_USERNAME}
      - PHONEPE_WEBHOOK_PASSWORD=${PHONEPE_WEBHOOK_PASSWORD}
      - FRONTEND_URL=${FRONTEND_URL}
      - JWT_SECRET=${JWT_SECRET}
    restart: always

  notification:
    image: node:20
    working_dir: /app
    volumes:
      - .:/app
    command: npx tsx services/notification/index.ts
    network_mode: "host"
    environment:
      - PORT=3004
      - DATABASE_URL=${DATABASE_URL}
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
    restart: always

  profile:
    image: node:20
    working_dir: /app
    volumes:
      - .:/app
    command: npx tsx services/profile/index.ts
    network_mode: "host"
    environment:
      - PORT=3005
      - DATABASE_URL=${DATABASE_URL}
    restart: always"""

    code_lines = [[Paragraph(line.replace(' ', '&nbsp;'), code_style)] for line in docker_compose_code.split('\n')]
    t_compose = Table(code_lines, colWidths=[7.0*inch])
    t_compose.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_compose)
    
    story.append(PageBreak())

    # ================= PAGE 7: NGINX & SSL =================
    story.append(Paragraph("5.5: Nginx Web Server SSL Setup (Certbot)", h2_style))
    story.append(Paragraph(
        "Nginx acts as a reverse proxy. It listens on public ports 80 (HTTP) and 443 (HTTPS), redirects all HTTP web requests to HTTPS, and forwards API queries targeting <code>/api</code> directly to the local Gateway running on port 8000.",
        body_style
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Step 5.5.1: Create Nginx Site Configuration:</b>", h2_style))
    story.append(Paragraph("1. Open the Nginx config editor: <code>sudo nano /etc/nginx/sites-available/lawoncall</code>", list_style))
    story.append(Paragraph("2. Paste the following configuration, replacing <code>api.yourdomain.com</code> with your actual backend subdomain:", list_style))
    
    nginx_config = """server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}"""
    nginx_lines = [[Paragraph(line.replace(' ', '&nbsp;'), code_style)] for line in nginx_config.split('\n')]
    t_nginx = Table(nginx_lines, colWidths=[7.0*inch])
    t_nginx.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_nginx)
    
    story.append(Spacer(1, 8))
    story.append(Paragraph("3. Enable the configuration by linking it to the active sites folder:", list_style))
    
    code_link = [
        [Paragraph("sudo ln -s /etc/nginx/sites-available/lawoncall /etc/nginx/sites-enabled/", code_style)],
        [Paragraph("sudo rm /etc/nginx/sites-enabled/default  # Remove default page config", code_style)],
        [Paragraph("sudo nginx -t  # Test if syntax is correct", code_style)],
        [Paragraph("sudo systemctl restart nginx  # Apply changes", code_style)]
    ]
    t_link = Table(code_link, colWidths=[7.0*inch])
    t_link.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_link)
    
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Step 5.5.2: Install Free SSL Certificate via Let's Encrypt:</b>", h2_style))
    story.append(Paragraph("To enable secure HTTPS encryption, run Certbot to automatically request and install your SSL certificate. Certbot will also automatically update Nginx settings for you.", body_style))
    
    code_certbot = [
        [Paragraph("sudo certbot --nginx -d api.yourdomain.com", code_style)]
    ]
    t_certbot = Table(code_certbot, colWidths=[7.0*inch])
    t_certbot.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_certbot)
    story.append(Paragraph("Follow the prompts on-screen: Enter your email, agree to the terms, and choose to <b>Redirect all HTTP traffic to HTTPS</b> automatically.", list_style))
    
    story.append(PageBreak())

    # ================= PAGE 8: ENV CHECKLIST =================
    story.append(Paragraph("6. Environment Variables & Credentials Checklist", h1_style))
    story.append(Paragraph(
        "Make sure your production environment variables inside the <code>/app/lawmate/.env</code> file on the EC2 instance are populated with the correct API keys. Below is the checklist of required values:",
        body_style
    ))
    story.append(Spacer(1, 5))
    
    env_headers = [
        Paragraph("<b>Variable Key</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', textColor=HexColor('#ffffff'))),
        Paragraph("<b>Category</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', textColor=HexColor('#ffffff'))),
        Paragraph("<b>Value Description / Production Placeholder</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', textColor=HexColor('#ffffff'))),
    ]
    
    env_rows = [
        env_headers,
        [
            Paragraph("<code>DATABASE_URL</code>", body_style),
            Paragraph("Database", body_style),
            Paragraph("<code>postgresql://postgres:YOUR_PASSWORD@rds-endpoint.amazonaws.com:5432/neondb?sslmode=require</code>", body_style)
        ],
        [
            Paragraph("<code>JWT_SECRET</code>", body_style),
            Paragraph("Security", body_style),
            Paragraph("Any cryptographically secure random string used to sign user auth tokens.", body_style)
        ],
        [
            Paragraph("<code>FRONTEND_URL</code>", body_style),
            Paragraph("Security", body_style),
            Paragraph("The URL of your frontend CloudFront CDN (e.g. <code>https://www.yourdomain.com</code>).", body_style)
        ],
        [
            Paragraph("<code>FIREBASE_PROJECT_ID</code>", body_style),
            Paragraph("Auth", body_style),
            Paragraph("Your Firebase Console project ID (e.g. <code>lawmate-prod</code>).", body_style)
        ],
        [
            Paragraph("<code>FIREBASE_CLIENT_EMAIL</code>", body_style),
            Paragraph("Auth", body_style),
            Paragraph("Firebase Service Account client email address.", body_style)
        ],
        [
            Paragraph("<code>FIREBASE_PRIVATE_KEY</code>", body_style),
            Paragraph("Auth", body_style),
            Paragraph("<b>CRITICAL FORMATTING:</b> Copy the service account private key from the JSON file. Paste it enclosed in double quotes (e.g. <code>\"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n\"</code>). The backslash-n characters are resolved programmatically at runtime.", body_style)
        ],
        [
            Paragraph("<code>PHONEPE_CLIENT_ID</code>", body_style),
            Paragraph("Payment", body_style),
            Paragraph("Your PhonePe API Merchant Client ID.", body_style)
        ],
        [
            Paragraph("<code>PHONEPE_CLIENT_SECRET</code>", body_style),
            Paragraph("Payment", body_style),
            Paragraph("Your PhonePe API Client Secret key.", body_style)
        ],
        [
            Paragraph("<code>PHONEPE_CLIENT_VERSION</code>", body_style),
            Paragraph("Payment", body_style),
            Paragraph("PhonePe API integration Client Version (defaults to <code>1</code>).", body_style)
        ],
        [
            Paragraph("<code>PHONEPE_ENV</code>", body_style),
            Paragraph("Payment", body_style),
            Paragraph("Set to <code>PRODUCTION</code> for live payment checkouts, or <code>SANDBOX</code> for testing.", body_style)
        ],
        [
            Paragraph("<code>PHONEPE_WEBHOOK_USERNAME</code>", body_style),
            Paragraph("Payment", body_style),
            Paragraph("Basic Auth username for securing PhonePe webhooks (defaults to <code>admin</code>).", body_style)
        ],
        [
            Paragraph("<code>PHONEPE_WEBHOOK_PASSWORD</code>", body_style),
            Paragraph("Payment", body_style),
            Paragraph("Basic Auth password for securing PhonePe webhooks (defaults to <code>password123</code>).", body_style)
        ],
        [
            Paragraph("<code>EXOTEL_API_KEY</code>", body_style),
            Paragraph("Calls/Exotel", body_style),
            Paragraph("Your Exotel account API key.", body_style)
        ],
        [
            Paragraph("<code>EXOTEL_API_TOKEN</code>", body_style),
            Paragraph("Calls/Exotel", body_style),
            Paragraph("Your Exotel account API token.", body_style)
        ],
        [
            Paragraph("<code>EXOTEL_ACCOUNT_SID</code>", body_style),
            Paragraph("Calls/Exotel", body_style),
            Paragraph("Your Exotel Account SID.", body_style)
        ],
        [
            Paragraph("<code>EXOTEL_SUBDOMAIN</code>", body_style),
            Paragraph("Calls/Exotel", body_style),
            Paragraph("Exotel API subdomain (typically <code>api.exotel.com</code>).", body_style)
        ],
        [
            Paragraph("<code>EXOTEL_EXOPHONE</code>", body_style),
            Paragraph("Calls/Exotel", body_style),
            Paragraph("Your Exotel virtual ExoPhone phone number.", body_style)
        ],
        [
            Paragraph("<code>EXOTEL_STATUS_CALLBACK_URL</code>", body_style),
            Paragraph("Calls/Exotel", body_style),
            Paragraph("Your backend call callback URL (e.g. <code>https://api.yourdomain.com/api/leads/call-status</code>).", body_style)
        ],
        [
            Paragraph("<code>SMTP_HOST</code>", body_style),
            Paragraph("Email", body_style),
            Paragraph("Mail server domain (e.g. <code>smtp.gmail.com</code>).", body_style)
        ],
        [
            Paragraph("<code>SMTP_PORT</code>", body_style),
            Paragraph("Email", body_style),
            Paragraph("Mail port (typically <code>587</code> for TLS/STARTTLS).", body_style)
        ],
        [
            Paragraph("<code>SMTP_USER</code>", body_style),
            Paragraph("Email", body_style),
            Paragraph("Email account username (e.g. <code>support@yourdomain.com</code>).", body_style)
        ],
        [
            Paragraph("<code>SMTP_PASS</code>", body_style),
            Paragraph("Email", body_style),
            Paragraph("Email account password (use a Gmail App Password if using Gmail).", body_style)
        ],
    ]
    
    t_env = Table(env_rows, colWidths=[2.2*inch, 0.9*inch, 3.9*inch], repeatRows=1)
    t_env.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HexColor('#1e293b')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#ffffff'), HexColor('#f8fafc')])
    ]))
    story.append(t_env)
    
    story.append(PageBreak())

    # ================= PAGE 9: TROUBLESHOOTING & SUMMARY =================
    story.append(Paragraph("7. Troubleshooting & Verification Checklist", h1_style))
    story.append(Paragraph(
        "Use these common administrative commands on your EC2 instance terminal to manage the services and troubleshoot errors:",
        body_style
    ))
    story.append(Spacer(1, 5))
    
    cmd_headers = [
        Paragraph("<b>Action Needed</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', textColor=HexColor('#ffffff'))),
        Paragraph("<b>Exact Command to Run</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', textColor=HexColor('#ffffff'))),
    ]
    
    cmd_rows = [
        cmd_headers,
        [
            Paragraph("Check microservice logs in real-time", body_style),
            Paragraph("<code>sudo docker-compose logs -f [service_name]</code><br/>(e.g., <code>sudo docker-compose logs -f gateway</code>)", body_style)
        ],
        [
            Paragraph("Check logs for all backend services", body_style),
            Paragraph("<code>sudo docker-compose logs --tail=100 -f</code>", body_style)
        ],
        [
            Paragraph("Restart all backend microservices", body_style),
            Paragraph("<code>sudo docker-compose restart</code>", body_style)
        ],
        [
            Paragraph("Apply environment variable changes", body_style),
            Paragraph("<code>sudo docker-compose down && sudo docker-compose up -d</code>", body_style)
        ],
        [
            Paragraph("Check server memory and disk space usage", body_style),
            Paragraph("<code>df -h && free -h</code>", body_style)
        ],
        [
            Paragraph("Check active Docker containers and resource usage", body_style),
            Paragraph("<code>sudo docker ps && sudo docker stats</code>", body_style)
        ],
        [
            Paragraph("Check if microservice ports are binding correctly", body_style),
            Paragraph("<code>sudo ss -tuln | grep -E '8000|3001|3002|3003|3004|3005'</code>", body_style)
        ],
        [
            Paragraph("Test backend API Gateway health endpoint", body_style),
            Paragraph("<code>curl -i http://localhost:8000/api/health</code>", body_style)
        ],
        [
            Paragraph("Test microservices direct status checks", body_style),
            Paragraph("<code>curl -i http://localhost:3001/ && curl -i http://localhost:3002/</code>", body_style)
        ]
    ]
    
    t_cmd = Table(cmd_rows, colWidths=[2.2*inch, 4.8*inch], repeatRows=1)
    t_cmd.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HexColor('#1e293b')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#ffffff'), HexColor('#f8fafc')])
    ]))
    story.append(t_cmd)
    
    story.append(Spacer(1, 15))
    story.append(Paragraph("<b>8. Verification Checklist for Go-Live:</b>", h2_style))
    story.append(Paragraph("• <b>DNS Mapping</b>: Point `api.yourdomain.com` (backend) to the EC2 Elastic IP using an A Record in your registrar console (e.g. Route53, GoDaddy).", list_style))
    story.append(Paragraph("• <b>CloudFront SSL</b>: CNAME `www.yourdomain.com` points to the CloudFront distribution domain (`xxxx.cloudfront.net`).", list_style))
    story.append(Paragraph("• <b>Database Connectivity</b>: Confirm backend services show successful PostgreSQL connection logs.", list_style))
    story.append(Paragraph("• <b>Let's Encrypt SSL Auto-renewal</b>: Certbot handles renewals automatically, check cron status using `sudo systemctl status certbot.timer`.", list_style))
    
    story.append(Spacer(1, 20))
    story.append(Paragraph("End of Documentation.", ParagraphStyle('EndDoc', parent=styles['Normal'], fontName='Helvetica-Oblique', textColor=HexColor('#64748b'), alignment=1)))

    # Build the document
    doc.build(
        story,
        onFirstPage=draw_cover_page,
        onLaterPages=draw_later_page
    )
    print("PDF AWS_Deployment_Guide.pdf built successfully!")

if __name__ == '__main__':
    build_pdf()
