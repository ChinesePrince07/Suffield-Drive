'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { User, LogOut, Shield } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function UserMenu() {
    const { isAdmin, login, logout } = useAuth();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        if (login(password)) {
            setIsLoginOpen(false);
            setPassword('');
            setError('');
        } else {
            setError('Incorrect password');
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <User className="h-5 w-5" />
                        {isAdmin && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {isAdmin ? (
                        <>
                            <div className="px-2 py-1.5 text-sm font-medium flex items-center gap-2">
                                <Shield className="h-4 w-4 text-green-500" />
                                Admin Mode
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </DropdownMenuItem>
                        </>
                    ) : (
                        <DropdownMenuItem onClick={() => setIsLoginOpen(true)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Admin Login
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader>
                        <DialogTitle>Admin Login</DialogTitle>
                        <DialogDescription>
                            Enter the admin password to access admin features.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                placeholder="Enter admin password"
                            />
                            {error && <p className="text-sm text-red-500">{error}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLoginOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleLogin}>Login</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
