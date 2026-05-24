export interface Team {
    id: string;
    name: string;
    foundedYear: number;
    isFactoryTeam: boolean;
    baseLocation: string;
    logoUrl: string;
}

export type DriverStatus = "World Champion" | "Race Winner" | "Podium Finisher" | "Rookie";

export interface Driver {
    id: string;
    name: string;
    biography: string;
    carNumber: number;
    isActive: boolean;
    birthDate: string;
    profileImageUrl: string;
    driverStatus: DriverStatus;
    favoriteTracks: string[];
    currentTeam: Team;
}