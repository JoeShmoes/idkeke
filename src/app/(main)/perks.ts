import { Palette, BarChart, Sliders, ClipboardCheck, Shield, Building, Gem } from 'lucide-react';

export const perks = [
    { level: 6, title: 'Unlock "Batman" Theme', description: 'A dark and focused theme for the modern vigilante.', icon: Palette },
    { level: 10, title: 'Unlock Advanced Finance Analytics', description: 'Gain access to deeper financial insights and charts.', icon: BarChart },
    { level: 12, title: 'Unlock All UI Themes', description: 'Gain access to all available visual themes instantly.', icon: Palette },
    { level: 15, title: 'Unlock Task Bulk Actions', description: 'Manage multiple tasks at once with bulk editing and deletion.', icon: Sliders },
    { level: 30, title: 'Unlock Project Templates', description: 'Create and reuse templates for common projects in the Project Board.', icon: ClipboardCheck },
    { level: 50, title: 'Unlock "God Mode" Theme', description: 'A theme for those who have mastered their domain.', icon: Shield },
    { level: 60, title: 'Unlock Custom Room Creation', description: 'Build your own custom rooms tailored to your workflow.', icon: Building },
    { level: 100, title: 'The Master Key', description: 'Congratulations. You have achieved full mastery. All future features will be available to you instantly.', icon: Gem },
]
