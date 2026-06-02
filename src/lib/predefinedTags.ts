export const predefinedTagsByCategory: Record<string, string[]> = {
    'פיתוח תוכנה (Software Development)': [
        'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js', 
        'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'C#', '.NET', 
        'C++', 'Ruby', 'Ruby on Rails', 'PHP', 'Laravel', 'Go', 'Rust', 
        'Swift', 'Kotlin', 'React Native', 'Flutter', 'HTML', 'CSS', 'Sass', 
        'Tailwind CSS', 'Redux', 'GraphQL', 'REST API', 'SQL', 'MySQL', 
        'PostgreSQL', 'NoSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 
        'AWS', 'Azure', 'Google Cloud', 'CI/CD', 'Git', 'GitHub', 'GitLab',
        'Microservices', 'System Design'
    ],
    'QA ובדיקות תוכנה': [
        'QA Manual', 'QA Automation', 'Selenium', 'Cypress', 'Playwright', 
        'Appium', 'Postman', 'JIRA', 'TestRail', 'Load Testing', 'JMeter',
        'API Testing', 'Mobile Testing', 'Web Testing', 'SQL QA'
    ],
    'מערכות מידע ותשתיות': [
        'DevOps', 'Linux', 'Windows Server', 'System Administrator', 
        'Network Engineer', 'IT Help Desk', 'Active Directory', 'VMware', 
        'Bash', 'Powershell', 'DBA', 'Oracle', 'SQL Server', 'Cybersecurity', 
        'Information Security', 'Penetration Testing', 'SOC Analyst', 
        'Firewall', 'Cisco'
    ],
    'עיצוב וחווית משתמש (UI/UX)': [
        'UX Design', 'UI Design', 'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 
        'Illustrator', 'InDesign', 'After Effects', 'Premiere Pro', 
        'Motion Graphics', 'Web Design', 'Graphic Design', 'Wireframing', 
        'Prototyping', 'User Research'
    ],
    'שיווק, דיגיטל ומכירות': [
        'SEO', 'PPC', 'Google Ads', 'Facebook Ads', 'Social Media Management', 
        'Content Creation', 'Copywriting', 'Email Marketing', 'Mailchimp', 
        'CRM', 'Salesforce', 'HubSpot', 'B2B Sales', 'B2C Sales', 
        'Account Management', 'Customer Success', 'Business Development', 
        'Affiliate Marketing', 'Growth Hacking'
    ],
    'ניהול פרויקטים ומוצר': [
        'Product Manager', 'Project Manager', 'Scrum Master', 'Agile', 
        'Kanban', 'JIRA', 'Monday', 'Trello', 'Asana', 'Data Analysis', 
        'Product Strategy', 'Roadmapping'
    ],
    'דאטה ומדע נתונים (Data)': [
        'Data Analyst', 'Data Scientist', 'Data Engineer', 'Machine Learning', 
        'Deep Learning', 'AI', 'NLP', 'Computer Vision', 'PyTorch', 
        'TensorFlow', 'Pandas', 'NumPy', 'Tableau', 'Power BI', 'Excel', 
        'Big Data', 'Hadoop', 'Spark', 'Snowflake'
    ],
    'כספים, אדמיניסטרציה ומשאבי אנוש': [
        'Bookkeeping', 'Accounting', 'CPA', 'Financial Analysis', 'Payroll', 
        'Office Manager', 'Executive Assistant', 'HR Manager', 'Talent Acquisition', 
        'Recruitment', 'Sourcing', 'Employee Retention', 'Labor Law'
    ],
    'הנדסה וייצור': [
        'Mechanical Engineer', 'Electrical Engineer', 'Civil Engineer', 
        'Industrial Engineer', 'AutoCAD', 'SolidWorks', 'PLC', 'QA Engineering', 
        'Production Manager', 'Logistics'
    ],
    'כללי ושונות': [
        'Customer Service', 'Call Center', 'Retail', 'Hospitality', 
        'Restaurant Worker', 'Delivery', 'Driver', 'Security', 'Cleaning', 
        'Freelance', 'Shift Work', 'Student Position'
    ]
};

export const getAllPredefinedTags = (): string[] => {
    const allTags = new Set<string>();
    Object.values(predefinedTagsByCategory).forEach(tags => {
        tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
};
