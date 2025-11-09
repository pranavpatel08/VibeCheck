
import React from 'react';
import { useCodeCourtStore } from '../store/useCodeCourtStore';
import { Persona, ConnectionStatus } from '../types';
import { Button } from './common';
import { ShieldCheck, Zap, Palette } from 'lucide-react';

const personaIcons = {
    [Persona.SECURITY]: <ShieldCheck className="w-4 h-4 mr-2" />,
    [Persona.SCALABILITY]: <Zap className="w-4 h-4 mr-2" />,
    [Persona.UI_UX]: <Palette className="w-4 h-4 mr-2" />,
};

const personaLabels = {
    [Persona.SECURITY]: 'Security',
    [Persona.SCALABILITY]: 'Scalability',
    [Persona.UI_UX]: 'UI/UX',
};

interface PersonaSelectorProps {
    connectionStatus: ConnectionStatus;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ connectionStatus }) => {
    const { activePersona, setActivePersona } = useCodeCourtStore();
    const isAnalyzing = connectionStatus === 'connecting' || connectionStatus === 'streaming';

    return (
        <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg">
            {Object.values(Persona).map((persona) => (
                <Button
                    key={persona}
                    variant={activePersona === persona ? 'default' : 'ghost'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setActivePersona(persona)}
                    disabled={isAnalyzing}
                >
                    {personaIcons[persona]}
                    {personaLabels[persona]}
                </Button>
            ))}
        </div>
    );
};

export default PersonaSelector;
