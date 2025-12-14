type Props = { params: { electionId: string } };

export default function VoterLoginPage({ params }: Props) {
    return (
        <main className="p-8 max-w-md mx-auto">
            <h1 className="text-xl font-semibold text-red-600">Voter Login</h1>
            <p className="mt-2 text-gray-600">
                Election ID: <b>{params.electionId}</b>
            </p>
            <p className="mt-2 text-gray-600">We’ll add studentId + voterKey + OTP next.</p>
        </main>
    );
}
