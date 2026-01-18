import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { App } from 'antd';

export function useSocialGraph(targetAddress: string) {
    const { getAccessToken, user } = usePrivy();
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    // Fetch Relationship from API (we need to update user API to return this, or adds a specific check endpoint)
    // For now, let's assume get-profile returns "isFollowing" field relative to current user if we pass a viewer param,
    // Or we create a specific status endpoint. Let's create a dedicated hook for status later.
    // Actually, let's use the existing profile fetch but we need a better way to check "Am I following this person".

    // Simplest: Fetch target user's followers list from API and check presence.
    const { data: profile } = useQuery({
        queryKey: ['user', targetAddress, user?.wallet?.address], // Depend on user state
        queryFn: async () => {
            const url = new URL(`/api/users/${targetAddress}`, window.location.origin);
            if (user?.wallet?.address) {
                url.searchParams.set('viewer', user.wallet.address);
            }
            return (await fetch(url.toString())).json();
        },
        enabled: !!targetAddress
    });

    // We need to know if *current logged in user* is in *targetAddress's* follower list.
    // The previous API implementation for profile return "followers" count. We might need the list or a boolean.
    // Let's rely on the profile page's data for now.

    const isFollowing = profile?.isFollowing || false;

    const { mutateAsync: toggleFollow } = useMutation({
        mutationFn: async (action: 'follow' | 'unfollow') => {
            const token = await getAccessToken();
            const res = await fetch('/api/social/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken: token, targetAddress, action })
            });
            if (!res.ok) throw new Error('Failed to update follow status');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', targetAddress] });
        },
        onError: (err) => {
            message.error("Action failed");
            console.error(err);
        }
    });

    return {
        isFollowing, // Placeholder until API update
        follow: () => toggleFollow('follow'),
        unfollow: () => toggleFollow('unfollow'),
        refetch: () => queryClient.invalidateQueries({ queryKey: ['user', targetAddress] })
    };
}
