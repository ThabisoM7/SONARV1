'use client';

import { withArtistAuth } from "@/lib/auth-guards";
import { MintButton } from "@/components/web3/MintButton";
import {
    Form,
    Input,
    Upload,
    Button,
    message,
    Tooltip
} from "antd";
import { InboxOutlined, AudioOutlined, FileImageOutlined, LoadingOutlined, InfoCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";
import { RcFile } from "antd/es/upload";
import { Disc, Layers, Library, UploadCloud, Music, X } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";
import splitterJson from "../../../../../src/artifacts/contracts/SongSplitter.sol/SongSplitter.json";

const { Dragger } = Upload;
const { TextArea } = Input;

type ReleaseType = 'SINGLE' | 'EP' | 'ALBUM';

interface TrackFile {
    id: string;
    file: RcFile;
    name: string;
    duration?: number;
}

function UploadTrackPage() {
    const { getAccessToken } = usePrivy();
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();

    // V3 State
    const [releaseType, setReleaseType] = useState<ReleaseType | null>(null);
    const [tracks, setTracks] = useState<TrackFile[]>([]);
    const [coverFile, setCoverFile] = useState<RcFile | null>(null);

    // Splits State
    const [collaborators, setCollaborators] = useState<{ address: string; share: number }[]>([]);
    const [splitterAddress, setSplitterAddress] = useState<string | null>(null);
    const [deployingSplitter, setDeployingSplitter] = useState(false);

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [successData, setSuccessData] = useState<any>(null); // { collectionId, metadataCids: [] }

    const steps = [
        { title: 'Type' },
        { title: 'Details' },
        { title: 'Tracks' },
        { title: 'Splits' }, // Restored
        { title: 'Publish' }, // Renamed from Review
    ];

    // Helper to get duration
    const getAudioDuration = (file: File): Promise<number> => {
        return new Promise((resolve) => {
            const objectUrl = URL.createObjectURL(file);
            const audio = new Audio(objectUrl);
            audio.onloadedmetadata = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(Math.floor(audio.duration));
            };
        });
    };

    const handleTrackUpload = async (file: RcFile) => {
        if (releaseType === 'SINGLE' && tracks.length >= 1) {
            message.error("Single can only have 1 track.");
            return Upload.LIST_IGNORE;
        }
        const duration = await getAudioDuration(file);
        const newTrack: TrackFile = {
            id: crypto.randomUUID(),
            file,
            name: file.name.replace(/\.[^/.]+$/, ""),
            duration
        };
        setTracks(prev => [...prev, newTrack]);
        return false;
    };

    const removeTrack = (id: string) => {
        setTracks(prev => prev.filter(t => t.id !== id));
    };

    const addCollaborator = () => {
        const addr = prompt("Enter Wallet Address (0x...):");
        if (!addr || !ethers.isAddress(addr)) return message.error("Invalid address");
        const share = prompt("Enter Share % (1-100):");
        if (!share || isNaN(parseInt(share))) return message.error("Invalid share");
        setCollaborators([...collaborators, { address: addr, share: parseInt(share) }]);
    };

    const handleDeploySplitter = async () => {
        if (!window.ethereum) return message.error("No wallet found");
        try {
            setDeployingSplitter(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const allPayees = collaborators.map(c => c.address);
            const allShares = collaborators.map(c => c.share);
            const total = allShares.reduce((a, b) => a + b, 0);
            if (total !== 100) return message.error(`Total shares must equal 100% (Current: ${total}%)`);

            const factory = new ethers.ContractFactory(splitterJson.abi, splitterJson.bytecode, signer);
            const contract = await factory.deploy(allPayees, allShares);
            message.loading({ content: 'Deploying Splitter Contract...', key: 'deploy' });

            await contract.waitForDeployment();
            const address = await contract.getAddress();

            setSplitterAddress(address);
            message.success({ content: 'Splitter Deployed!', key: 'deploy' });
            setDeployingSplitter(false);
        } catch (e: any) {
            console.error(e);
            message.error(e.message || "Failed to deploy splitter");
            setDeployingSplitter(false);
        }
    };

    const handleSubmit = async () => {
        try {
            setUploading(true);
            setUploadProgress('Initializing...');

            // 1. Upload Cover Art
            setUploadProgress('Uploading Cover Art...');
            if (!coverFile) throw new Error("Cover art missing");
            const coverFormData = new FormData();
            coverFormData.append('file', coverFile);
            const coverRes = await fetch('/api/ipfs/upload', { method: 'POST', body: coverFormData }).then(r => r.json());

            // 2. Upload Tracks Batch & Config Metadata
            const trackMetadataList = [];

            for (let i = 0; i < tracks.length; i++) {
                setUploadProgress(`Uploading Track ${i + 1}/${tracks.length}...`);
                const track = tracks[i];

                // FIX: If it's a SINGLE, ensure the track title matches the Release Title
                // The user enters "Release Title" in Step 1, but "Track Name" defaults to filename.
                const finalTrackName = releaseType === 'SINGLE' ? form.getFieldValue('title') : track.name;

                const trackFormData = new FormData();
                trackFormData.append('file', track.file);
                const trackRes = await fetch('/api/ipfs/upload', { method: 'POST', body: trackFormData }).then(r => r.json());

                // Metadata Object (OpenSea Standard)
                const metadata = {
                    name: finalTrackName,
                    description: form.getFieldValue('description'),
                    image: `ipfs://${coverRes.IpfsHash}`,
                    animation_url: `ipfs://${trackRes.IpfsHash}`,
                    external_url: 'https://cr8te.xyz',
                    attributes: [
                        { trait_type: 'Genre', value: form.getFieldValue('genre') },
                        { trait_type: 'Type', value: releaseType }
                    ]
                };

                // Upload Metadata JSON
                const metaFormData = new FormData();
                metaFormData.append('jsonBody', JSON.stringify({
                    pinataContent: metadata,
                    pinataMetadata: { name: `${finalTrackName}-metadata.json` }
                }));
                const metaRes = await fetch('/api/ipfs/upload', { method: 'POST', body: metaFormData }).then(r => r.json());

                trackMetadataList.push({
                    title: finalTrackName,
                    audioCid: trackRes.IpfsHash,
                    metadataCid: metaRes.IpfsHash, // Important for Minting
                    duration: track.duration,
                    trackNumber: i + 1
                });
            }

            // 3. Save to Database (The "Music Graph")
            setUploadProgress('Saving to Catalog...');
            const values = await form.validateFields();
            console.log("Form Values:", values); // DEBUG
            const token = await getAccessToken();

            const payload = {
                authToken: token,
                title: String(values.title || ''), // Force string
                description: values.description || '',
                genre: values.genre || 'Unknown',
                type: releaseType,
                coverCid: coverRes.IpfsHash,
                tracks: trackMetadataList,
                splitterAddress: splitterAddress // Save this for reference? Schema update needed? Or just for minting?
            };

            const dbRes = await fetch('/api/music/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!dbRes.ok) {
                const errData = await dbRes.json();
                throw new Error(errData.error || "Failed to save to database");
            }
            const dbData = await dbRes.json();

            setSuccessData({ ...dbData, tracks: trackMetadataList });
            setUploading(false);
            message.success("Release saved! Ready to mint.");
        } catch (error: any) {
            console.error(error);
            message.error(error.message || "Upload failed");
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground m-0">New Release</h1>
                    <p className="text-muted-foreground">Add to your artist catalog.</p>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex justify-between items-center relative mb-12 max-w-2xl mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 rounded-full" />
                <div className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary to-blue-500 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} />
                {steps.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    return (
                        <div key={index} className="relative z-10 flex flex-col items-center gap-2 group cursor-default">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] scale-110' :
                                isCompleted ? 'bg-gray-900 border-primary text-primary' : 'bg-gray-900 border-white/10 text-gray-500'
                                }`}>
                                {isCompleted ? <div className="w-3 h-3 bg-primary rounded-full" /> : <span className="text-sm font-bold">{index + 1}</span>}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider absolute -bottom-8 whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                                {step.title}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="glass p-8 rounded-2xl border border-white/5 min-h-[400px]">

                {/* STEP 0: TYPE */}
                {currentStep === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-center">
                        {[
                            { id: 'SINGLE', label: 'Single', icon: Disc, desc: '1 Track' },
                            { id: 'EP', label: 'EP', icon: Layers, desc: '2-6 Tracks' },
                            { id: 'ALBUM', label: 'Album', icon: Library, desc: '7+ Tracks' }
                        ].map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setReleaseType(type.id as ReleaseType)}
                                className={`p-8 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-4 group ${releaseType === type.id
                                    ? 'bg-primary/20 border-primary shadow-[0_0_30px_rgba(124,58,237,0.2)]'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                            >
                                <type.icon size={48} className={releaseType === type.id ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
                                <div className="text-center">
                                    <h3 className={`text-xl font-bold mb-1 ${releaseType === type.id ? 'text-white' : 'text-gray-300'}`}>{type.label}</h3>
                                    <p className="text-sm text-gray-500">{type.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* STEP 1: DETAILS */}
                {currentStep === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-foreground">Release Details</h3>
                            <Form form={form} layout="vertical" initialValues={{ genre: 'Electronic' }}>
                                <Form.Item name="title" label={<span className="text-foreground">Release Title</span>} rules={[{ required: true }]}>
                                    <Input size="large" className="bg-white/5 border-border text-foreground rounded-xl" placeholder={releaseType === 'SINGLE' ? "Song Title" : "Album Title"} />
                                </Form.Item>
                                <Form.Item name="genre" label={<span className="text-foreground">Genre</span>} rules={[{ required: true }]}>
                                    <Input size="large" className="bg-white/5 border-border text-foreground rounded-xl" />
                                </Form.Item>
                                <Form.Item name="description" label={<span className="text-foreground">Description</span>}>
                                    <TextArea rows={4} className="bg-white/5 border-border text-foreground rounded-xl" placeholder="Tell the story..." />
                                </Form.Item>
                            </Form>
                        </div>
                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="relative group">
                                <div className={`w-64 h-64 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed transition-all ${coverFile ? 'border-transparent' : 'border-white/20 bg-white/5'}`}>
                                    {coverFile ? (
                                        <img src={URL.createObjectURL(coverFile)} alt="Cover" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <FileImageOutlined style={{ fontSize: 48 }} />
                                            <p className="mt-2">Upload Cover</p>
                                        </div>
                                    )}
                                </div>
                                <Upload showUploadList={false} beforeUpload={(f) => { setCoverFile(f); return false; }}>
                                    <Button type="dashed" className="mt-4 border-border text-foreground hover:text-primary">Select Image</Button>
                                </Upload>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: TRACKS */}
                {currentStep === 2 && (
                    <div className="space-y-8">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-foreground">Upload Tracks</h3>
                            <p className="text-muted-foreground">{releaseType === 'SINGLE' ? 'Upload your single track.' : `Add tracks for your ${releaseType?.toLowerCase()}.`}</p>
                        </div>
                        <Dragger
                            accept="audio/*"
                            multiple={releaseType !== 'SINGLE'}
                            beforeUpload={handleTrackUpload}
                            showUploadList={false}
                            className="bg-white/5 border-border hover:border-primary/50 text-foreground rounded-xl"
                        >
                            <p className="text-4xl mb-4"><UploadCloud className="mx-auto text-primary" /></p>
                            <p className="text-lg font-bold text-foreground">Drop audio files here</p>
                            <p className="text-muted-foreground">WAV, MP3, FLAC supported</p>
                        </Dragger>
                        <div className="space-y-2 mt-8">
                            {tracks.map((track, i) => (
                                <div key={track.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <input
                                            value={track.name}
                                            onChange={(e) => {
                                                const newTracks = [...tracks];
                                                newTracks[i].name = e.target.value;
                                                setTracks(newTracks);
                                            }}
                                            className="bg-transparent text-foreground font-bold w-full focus:outline-none focus:border-b border-primary"
                                        />
                                        <div className="text-xs text-muted-foreground flex gap-2">
                                            <span>{Math.floor((track.duration || 0) / 60)}:{((track.duration || 0) % 60).toString().padStart(2, '0')}</span>
                                            <span>•</span>
                                            <span>{(track.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </div>
                                    <button onClick={() => removeTrack(track.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                        <DeleteOutlined />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: SPLITS */}
                {currentStep === 3 && (
                    <div className="space-y-8 max-w-lg mx-auto w-full">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-foreground mb-2">Royalty Splits</h3>
                            <p className="text-muted-foreground">Add collaborators to automatically split revenue.</p>
                        </div>
                        <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-foreground m-0">Collaborators</h4>
                                <Button onClick={addCollaborator} type="dashed" className="bg-white/5 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/50">Add +</Button>
                            </div>
                            {collaborators.map((c, i) => (
                                <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 mb-2">
                                    <span className="font-mono text-gray-300 text-sm">{c.address.slice(0, 6)}...{c.address.slice(-4)}</span>
                                    <span className="font-bold text-green-400 bg-green-900/20 px-3 py-1 rounded-full border border-green-900/50">{c.share}%</span>
                                </div>
                            ))}
                            {collaborators.length > 0 && (
                                <div className="border-t border-border pt-4 mt-4 flex justify-between font-bold">
                                    <span className="text-foreground">Total</span>
                                    <span className={`text-lg ${collaborators.reduce((a, b) => a + b.share, 0) !== 100 ? "text-red-500" : "text-green-500"}`}>
                                        {collaborators.reduce((a, b) => a + b.share, 0)}%
                                    </span>
                                </div>
                            )}
                        </div>
                        {collaborators.length > 0 && !splitterAddress && (
                            <Button
                                type="primary"
                                block
                                size="large"
                                onClick={handleDeploySplitter}
                                loading={deployingSplitter}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 h-12 text-lg font-bold shadow-lg shadow-purple-900/20 hover:scale-[1.02] transition-transform"
                            >
                                Deploy Payment Splitter Contract
                            </Button>
                        )}
                        {splitterAddress && (
                            <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <span className="text-green-400 font-mono text-sm">Splitter Deployed: {splitterAddress}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 4: REVIEW & MINT */}
                {currentStep === 4 && (
                    <div className="text-center max-w-lg mx-auto space-y-8">
                        {!uploading && !successData ? (
                            <>
                                <h3 className="text-2xl font-bold text-foreground">Ready to Release?</h3>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                    <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden mb-4 shadow-lg">
                                        {coverFile && <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover" />}
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-1">{form.getFieldValue('title')}</h2>
                                    <p className="text-primary font-bold tracking-wider text-sm uppercase">{releaseType} • {tracks.length} Tracks</p>
                                </div>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handleSubmit}
                                    className="h-14 px-12 text-lg rounded-full font-bold bg-primary shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:scale-105 transition-transform"
                                >
                                    Publish to Catalog (Database)
                                </Button>
                            </>
                        ) : successData ? (
                            <div className="py-12 space-y-6 animate-in fade-in zoom-in">
                                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                                    <Music size={40} className="text-black" />
                                </div>
                                <h2 className="text-3xl font-bold text-white">Release Saved!</h2>
                                <p className="text-gray-400">Your music is now in your catalog. You can mint it now or later.</p>

                                {/* Minting Options for First Track (MVP) */}
                                {successData.tracks && successData.tracks[0] && (
                                    <div className="mt-8 p-6 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                                        <h4 className="text-lg font-bold text-purple-300 mb-4">Mint "{successData.tracks[0].title}" on Blockchain</h4>
                                        <MintButton
                                            metadataCid={successData.tracks[0].metadataCid}
                                            onSuccess={() => message.success('Track minted!')}
                                            receiver={splitterAddress || undefined}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Currently supports minting Single tracks directly.</p>
                                    </div>
                                )}

                                <Button onClick={() => window.location.href = '/artist/dashboard'} className="glass text-white border-white/20 mt-4">Go to Dashboard</Button>
                            </div>
                        ) : (
                            <div className="py-20 space-y-4">
                                <LoadingOutlined style={{ fontSize: 48 }} className="text-primary" />
                                <h3 className="text-xl font-bold text-white">{uploadProgress}</h3>
                                <p className="text-gray-500 text-sm">Do not close this window.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            {!uploading && !successData && (
                <div className="flex justify-between max-w-2xl mx-auto">
                    <Button
                        disabled={currentStep === 0}
                        onClick={() => setCurrentStep(c => c - 1)}
                        type="text"
                        className="text-gray-400 hover:text-white"
                    >
                        Back
                    </Button>
                    <Button
                        type="primary"
                        disabled={
                            (currentStep === 0 && !releaseType) ||
                            (currentStep === 1 && (!coverFile || !form.getFieldValue('title'))) ||
                            (currentStep === 2 && tracks.length === 0) ||
                            (currentStep === 3 && collaborators.length > 0 && !splitterAddress)
                        }
                        onClick={() => {
                            if (currentStep < 4) setCurrentStep(c => c + 1);
                        }}
                        className={`rounded-full px-8 ${currentStep === 4 ? 'hidden' : ''}`}
                    >
                        {currentStep === 3 && collaborators.length === 0 ? 'Skip Splits' : 'Next'}
                    </Button>
                </div>
            )}
        </div>
    );
}

export default withArtistAuth(UploadTrackPage);
