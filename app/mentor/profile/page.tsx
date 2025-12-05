'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MentorNavbar } from '@/components/MentorNavbar';
import { Chat } from '@/components/Chat';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [experience, setExperience] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [isActive, setIsActive] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/mentor');
          return;
        }

        // Fetch profile from profiles table
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn('Profiles table may not exist yet:', error.message);
        }

        if (profileData) {
          setProfile(profileData);
          setFullName(profileData.full_name || '');
          setProfession(profileData.profession || '');
          setExperience(profileData.experience || '');
          setExpertise(profileData.expertise || []);
          setBio(profileData.bio || '');
          setIsActive(profileData.is_active || false);
        } else {
          // Use auth metadata as fallback
          setFullName(session.user.user_metadata?.full_name || '');
          setProfession(session.user.user_metadata?.profession || '');
          setExperience(session.user.user_metadata?.experience || '');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/auth/mentor');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Update profile in profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: fullName,
          profession,
          experience,
          expertise,
          bio,
          is_active: isActive,
          email: session.user.email,
          role: 'mentor',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('Profile updated successfully!');
      router.push('/mentor/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpertise = (item: string) => {
    if (expertise.includes(item)) {
      setExpertise(expertise.filter(e => e !== item));
    } else {
      setExpertise([...expertise, item]);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600" />
      </div>
    );
  }

  const expertiseOptions = [
    'Software Development',
    'Data Science',
    'Business Strategy',
    'Marketing',
    'Design',
    'Engineering',
    'Medicine',
    'Law',
    'Education',
    'Finance',
    'Entrepreneurship',
    'Research'
  ];

  return (
    <>
      <MentorNavbar />
      <div className="min-h-screen pt-28 pb-12 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">👤 Edit Profile</h1>
            <p className="text-slate-600 text-lg">Update your mentor information</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200 space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-purple-500 focus:outline-none"
                placeholder="John Doe"
              />
            </div>

            {/* Profession */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Profession *
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-purple-500 focus:outline-none"
                placeholder="Software Engineer"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Years of Experience *
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="">Select experience</option>
                <option value="1-2 years">1-2 years</option>
                <option value="3-5 years">3-5 years</option>
                <option value="5-10 years">5-10 years</option>
                <option value="10+ years">10+ years</option>
              </select>
            </div>

            {/* Expertise */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Areas of Expertise
              </label>
              <div className="grid grid-cols-2 gap-2">
                {expertiseOptions.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleExpertise(item)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      expertise.includes(item)
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-200 hover:border-purple-300 text-slate-700'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-purple-500 focus:outline-none"
                placeholder="Tell mentees about yourself..."
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <div>
                <h3 className="font-semibold text-slate-900">Active Status</h3>
                <p className="text-sm text-slate-600">
                  Show as available to mentees
                </p>
              </div>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  isActive ? 'bg-green-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => router.push('/mentor/dashboard')}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !fullName || !profession || !experience}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Chat />
    </>
  );
}

