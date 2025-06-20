export interface TeamDetailComponentProps {
    teamId: string;
    compact?: boolean;
    showOpenInTeamsButton?: boolean;
    context?: 'modal' | 'sidepanel' | 'fullscreen';
}