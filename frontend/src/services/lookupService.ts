import { api } from "@/src/lib/api";
import type { LookupItemDto, TeamMemberLookupDto } from "@/src/types/common";

async function getLookup<TId = string> (path:string) {
    const response = await api.get<LookupItemDto<TId>[]>(path);
    return response.data;
}

export const lookupService = {
    getCategories: () => getLookup("/lookups/categories"),
    getSubcategories: (categoryId: string) =>
        getLookup(`/lookups/categories/${categoryId}/subcategories`),
    getPriorities: () => getLookup("/lookups/priorities"),
    getStatuses: () => getLookup("/lookups/statuses"),
    getImpactLevels: () => getLookup("/lookups/impact-levels"),
    getUrgencyLevels: () => getLookup("/lookups/urgency-levels"),
    getTeams: () => getLookup("/lookups/teams"),
    getDepartments: () => getLookup<number>("/lookups/departments"),
    getRoles: () => getLookup("/lookups/roles"),
    getResolutionCategories: () => getLookup("/lookups/resolution-categories"),
    getTeamMembers: async (teamId: string): Promise<TeamMemberLookupDto[]> => {
        const response = await api.get<TeamMemberLookupDto[]>(
            `/lookups/teams/${teamId}/members`,
        );
        return response.data;
    },
};
