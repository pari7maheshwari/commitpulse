/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { EditorPanel } from './EditorPanel';
import type { GeneratorState } from '../types';

describe('EditorPanel - Edge Cases & Empty/Missing Inputs Verification', () => {
  const mockHandlers = {
    onNameChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onTechsChange: vi.fn(),
    onSocialsChange: vi.fn(),
    onSocialLinkChange: vi.fn(),
    onGithubUsernameChange: vi.fn(),
    onShowCommitPulseChange: vi.fn(),
    onCommitPulseAccentChange: vi.fn(),
  };

  const defaultEmptyState: GeneratorState = {
    name: '',
    description: '',
    selectedTechs: [],
    selectedSocials: [],
    socialLinks: {},
    githubUsername: '',
    showCommitPulse: false,
    commitPulseAccent: '',
  };

  it('renders successfully with a default empty state', () => {
    render(<EditorPanel state={defaultEmptyState} {...mockHandlers} />);

    // Check that NameSection input is empty
    const nameInput = screen.getByPlaceholderText(/e.g. Omkar/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue('');
  });

  it('does not crash when state is passed as an empty object (type casting)', () => {
    const emptyObjState = {} as any;
    expect(() => render(<EditorPanel state={emptyObjState} {...mockHandlers} />)).not.toThrow();
  });

  it('does not crash when state lists (techs, socials, links) are null/undefined', () => {
    const brokenState = {
      name: null,
      description: null,
      selectedTechs: null,
      selectedSocials: null,
      socialLinks: null,
      githubUsername: null,
      showCommitPulse: null,
      commitPulseAccent: null,
    } as any;

    expect(() => render(<EditorPanel state={brokenState} {...mockHandlers} />)).not.toThrow();
  });

  it('maintains the standard section container layout when data is empty', () => {
    const { container } = render(<EditorPanel state={defaultEmptyState} {...mockHandlers} />);

    // Div structure containing sections
    expect(container.querySelector('.flex-col')).toBeInTheDocument();
  });

  it('handles rendering with missing/undefined callback handlers gracefully', () => {
    // Cast empty handlers to check if component tolerates lack of action handlers during hydration

    const missingHandlers = {} as any;
    expect(() =>
      render(<EditorPanel state={defaultEmptyState} {...missingHandlers} />)
    ).not.toThrow();
  });
});
