'use client';

import { withArtistAuth } from "@/lib/auth-guards";
import { MintButton } from "@/components/web3/MintButton";
import {
    Typography,
    Card,
    Form,
    Input,
    Upload,
    Button,
    Steps,
    message,
    Row,
    Col
} from "antd";
import { InboxOutlined, AudioOutlined, FileImageOutlined } from "@ant-design/icons";
import { useState } from "react";
import { RcFile } from "antd/es/upload";

import { ethers } from "ethers";
import splitterJson from "../../../../../src/artifacts/contracts/SongSplitter.sol/SongSplitter.json";

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

function UploadTrackPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [audioFile, setAudioFile] = useState<RcFile | null>(null);
    const [imageFile, setImageFile] = useState<RcFile | null>(null);
    const [uploading, setUploading] = useState(false);
    const [ipfsResult, setIpfsResult] = useState<{ audioCid: string; imageCid: string; metadataCid: string } | null>(null);
    const [collaborators, setCollaborators] = useState<{ address: string; share: number }[]>([]);
    const [splitterAddress, setSplitterAddress] = useState<string | null>(null);
    const [deployingSplitter, setDeployingSplitter] = useState(false);

    const steps = [
        { title: 'Upload Audio' },
        { title: 'Cover Art' },
        { title: 'Details' },
        { title: 'Splits' },
        { title: 'Mint' },
    ];

    const uploadToIpfs = async (file: RcFile) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/ipfs/upload', {
            method: 'POST',
            body: formData
        });
        return res.json();
    };

    const uploadMetadata = async (metadata: any) => {
        const formData = new FormData();
        formData.append('jsonBody', JSON.stringify({
            pinataContent: metadata,
            pinataMetadata: { name: `${metadata.name}-metadata.json` }
        }));
        const res = await fetch('/api/ipfs/upload', {
            method: 'POST',
            body: formData
        });
        return res.json();
    }

    const handleDeploySplitter = async () => {
        if (!window.ethereum) return message.error("No wallet found");

        try {
            setDeployingSplitter(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Add self to collaborators if not present? Or assume user adds self.
            // Logic: Payees and Shares arrays
            const allPayees = collaborators.map(c => c.address);
            const allShares = collaborators.map(c => c.share);

            // Validation
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
            setCurrentStep(4);
        } catch (e: any) {
            console.error(e);
            message.error(e.message || "Failed to deploy splitter");
            setDeployingSplitter(false);
        }
    };

    const handleNext = async () => {
        if (currentStep === 0 && !audioFile) {
            message.error('Please upload an audio file first.');
            return;
        }
        if (currentStep === 1 && !imageFile) {
            message.error('Please upload cover art.');
            return;
        }
        if (currentStep === 2) {
            // Validate fields
            try {
                const values = await form.validateFields();
                setUploading(true);

                // 1. Upload Audio
                message.loading({ content: 'Uploading Audio to IPFS...', key: 'upload' });
                const audioRes = await uploadToIpfs(audioFile!);
                if (!audioRes.IpfsHash) throw new Error('Audio upload failed');

                // 2. Upload Image
                message.loading({ content: 'Uploading Artwork to IPFS...', key: 'upload' });
                const imageRes = await uploadToIpfs(imageFile!);
                if (!imageRes.IpfsHash) throw new Error('Image upload failed');

                // 3. Create & Upload Metadata
                const metadata = {
                    name: values.title,
                    description: values.description,
                    image: `ipfs://${imageRes.IpfsHash}`,
                    animation_url: `ipfs://${audioRes.IpfsHash}`,
                    external_url: 'https://cr8te.xyz',
                    attributes: [
                        { trait_type: 'Artist', value: 'You' },
                        { trait_type: 'Genre', value: values.genre }
                    ]
                };

                message.loading({ content: 'Pinning Metadata...', key: 'upload' });
                const metaRes = await uploadMetadata(metadata);

                setIpfsResult({
                    audioCid: audioRes.IpfsHash,
                    imageCid: imageRes.IpfsHash,
                    metadataCid: metaRes.IpfsHash
                });

                message.success({ content: 'All assets uploaded to IPFS!', key: 'upload' });
                setUploading(false);
                setCurrentStep(3);
                return;
            } catch (e) {
                console.error(e);
                message.error({ content: 'Upload failed.', key: 'upload' });
                setUploading(false);
                return;
            }
        }

        if (currentStep === 3) {
            // Validating splits
            if (collaborators.length === 0) {
                // No splits, skip to mint
                setCurrentStep(4);
            } else {
                // Must deploy splitter
                if (!splitterAddress) {
                    await handleDeploySplitter();
                    // handleDeploySplitter sets step to 4 on success
                } else {
                    setCurrentStep(4);
                }
            }
            return;
        }

        setCurrentStep(currentStep + 1);
    };

    const addCollaborator = () => {
        // Simple prompt or form - for MVP using prompt is okay but let's do inline input
        const addr = prompt("Enter Wallet Address (0x...):");
        if (!addr || !ethers.isAddress(addr)) return message.error("Invalid address");
        const share = prompt("Enter Share % (1-100):");
        if (!share || isNaN(parseInt(share))) return message.error("Invalid share");

        setCollaborators([...collaborators, { address: addr, share: parseInt(share) }]);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <Title level={2} style={{ margin: 0 }}>Upload New Track</Title>
            </div>

            {/* Glass Steps */}
            <div className="flex justify-between items-center relative mb-12">
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
                                {isCompleted ? (
                                    <div className="w-3 h-3 bg-primary rounded-full" />
                                ) : (
                                    <span className="text-sm font-bold">{index + 1}</span>
                                )}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider absolute -bottom-8 whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                                {step.title}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="glass p-8 rounded-2xl border border-white/5 min-h-[400px] flex flex-col justify-center">
                {currentStep === 0 && (
                    <div className="text-center space-y-8 py-8">
                        <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                            <AudioOutlined style={{ fontSize: 40, color: '#3b82f6' }} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">Upload Audio Source</h3>
                            <p className="text-muted-foreground">Supported formats: MP3, WAV, FLAC (Max 50MB)</p>
                        </div>

                        <Dragger
                            accept="audio/*"
                            beforeUpload={(file) => {
                                setAudioFile(file);
                                return false;
                            }}
                            fileList={audioFile ? [audioFile] : []}
                            onRemove={() => setAudioFile(null)}
                            className="bg-white/5 border-white/10 hover:border-primary/50 text-gray-300 rounded-xl overflow-hidden group transition-colors"
                        >
                            <p className="ant-upload-drag-icon text-gray-500 group-hover:text-primary transition-colors">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text text-gray-300">Click or drag file to this area to upload</p>
                        </Dragger>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="text-center space-y-8 py-8">
                        <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                            <FileImageOutlined style={{ fontSize: 40, color: '#22c55e' }} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">Upload Cover Art</h3>
                            <p className="text-muted-foreground">Square aspect ratio recommended (Max 5MB)</p>
                        </div>

                        <Dragger
                            accept="image/*"
                            beforeUpload={(file) => {
                                setImageFile(file);
                                return false;
                            }}
                            fileList={imageFile ? [imageFile] : []}
                            onRemove={() => setImageFile(null)}
                            listType="picture"
                            className="bg-white/5 border-white/10 hover:border-green-500/50 text-gray-300 rounded-xl overflow-hidden group transition-colors"
                        >
                            <p className="ant-upload-drag-icon text-gray-500 group-hover:text-green-500 transition-colors">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text text-gray-300">Click or drag file to this area to upload</p>
                        </Dragger>
                    </div>
                )}

                {currentStep === 2 && (
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{ genre: 'Electronic' }}
                        className="max-w-md mx-auto w-full pt-4"
                    >
                        <Form.Item name="title" label={<span className="text-foreground">Track Title</span>} rules={[{ required: true }]}>
                            <Input size="large" placeholder="e.g. Midnight City" className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground rounded-xl hover:border-primary focus:border-primary" />
                        </Form.Item>
                        <Form.Item name="genre" label={<span className="text-foreground">Genre</span>} rules={[{ required: true }]}>
                            <Input size="large" placeholder="e.g. House" className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground rounded-xl hover:border-primary focus:border-primary" />
                        </Form.Item>
                        <Form.Item name="description" label={<span className="text-foreground">Description</span>}>
                            <TextArea rows={4} placeholder="Tell the story behind this track..." className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground rounded-xl hover:border-primary focus:border-primary" />
                        </Form.Item>
                    </Form>
                )}

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

                            {collaborators.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl bg-white/5">
                                    No splits added. 100% goes to you.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {collaborators.map((c, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                                            <span className="font-mono text-gray-300 text-sm">{c.address.slice(0, 6)}...{c.address.slice(-4)}</span>
                                            <span className="font-bold text-green-400 bg-green-900/20 px-3 py-1 rounded-full border border-green-900/50">{c.share}%</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-border pt-4 mt-4 flex justify-between font-bold">
                                        <span className="text-foreground">Total</span>
                                        <span className={`text-lg ${collaborators.reduce((a, b) => a + b.share, 0) !== 100 ? "text-red-500" : "text-green-500"}`}>
                                            {collaborators.reduce((a, b) => a + b.share, 0)}%
                                        </span>
                                    </div>
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

                {currentStep === 4 && ipfsResult && (
                    <div className="text-center py-8 space-y-8">
                        <div className="p-6 bg-green-500/10 rounded-2xl border border-green-500/20 mb-8 inline-block max-w-sm">
                            <h3 className="text-xl font-bold text-green-400 mb-2">Ready to Mint!</h3>
                            <p className="text-green-200/70 text-sm break-all font-mono">Metadata CID: {ipfsResult.metadataCid}</p>
                        </div>

                        <div className="max-w-md mx-auto">
                            <MintButton
                                metadataCid={ipfsResult.metadataCid}
                                onSuccess={() => message.success('Track published to blockchain!')}
                                receiver={splitterAddress || undefined}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between">
                <div className="flex justify-between items-center relative">
                    <Button
                        disabled={currentStep === 0 || currentStep === 4}
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="h-10 px-6 rounded-full border-border text-foreground bg-white/5 disabled:opacity-50 disabled:bg-transparent"
                        type="text"
                    >
                        Back
                    </Button>
                    {/* Hide Next button if on Splits step with pending deployment logic, forcing use of main CTA */}
                    {currentStep < 4 && currentStep !== 3 && (
                        <Button
                            type="primary"
                            onClick={handleNext}
                            loading={uploading}
                            className="h-10 px-8 rounded-full bg-primary hover:bg-primary/90 border-0 font-bold shadow-lg shadow-primary/25"
                        >
                            {currentStep === 2 ? 'Upload files to IPFS' : 'Next'}
                        </Button>
                    )}
                    {currentStep === 3 && (
                        <Button
                            type="primary"
                            onClick={handleNext}
                            disabled={collaborators.length > 0 && !splitterAddress}
                            className="h-10 px-8 rounded-full bg-primary hover:bg-primary/90 border-0 font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:bg-gray-700"
                        >
                            {collaborators.length === 0 ? 'Skip Splits' : 'Next'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default withArtistAuth(UploadTrackPage);
