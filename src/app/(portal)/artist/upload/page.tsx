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

            <Steps current={currentStep} items={steps} />

            <Card>
                {currentStep === 0 && (
                    <div className="text-center py-10 space-y-6">
                        <div className="mb-4">
                            <AudioOutlined style={{ fontSize: 48, color: '#1677ff' }} />
                        </div>
                        <Title level={4}>Upload Your Audio Source</Title>
                        <Text type="secondary">Supported formats: MP3, WAV, FLAC (Max 50MB)</Text>

                        <Dragger
                            accept="audio/*"
                            beforeUpload={(file) => {
                                setAudioFile(file);
                                return false; // Prevent auto upload
                            }}
                            fileList={audioFile ? [audioFile] : []}
                            onRemove={() => setAudioFile(null)}
                            className="mt-6"
                        >
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">Click or drag file to this area to upload</p>
                        </Dragger>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="text-center py-10 space-y-6">
                        <div className="mb-4">
                            <FileImageOutlined style={{ fontSize: 48, color: '#87d068' }} />
                        </div>
                        <Title level={4}>Upload Cover Art</Title>
                        <Text type="secondary">Square aspect ratio recommended (Max 5MB)</Text>

                        <Dragger
                            accept="image/*"
                            beforeUpload={(file) => {
                                setImageFile(file);
                                return false;
                            }}
                            fileList={imageFile ? [imageFile] : []}
                            onRemove={() => setImageFile(null)}
                            listType="picture"
                            className="mt-6"
                        >
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">Click or drag file to this area to upload</p>
                        </Dragger>
                    </div>
                )}

                {currentStep === 2 && (
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{ genre: 'Electronic' }}
                    >
                        <Form.Item name="title" label="Track Title" rules={[{ required: true }]}>
                            <Input size="large" placeholder="e.g. Midnight City" />
                        </Form.Item>
                        <Form.Item name="genre" label="Genre" rules={[{ required: true }]}>
                            <Input size="large" placeholder="e.g. House" />
                        </Form.Item>
                        <Form.Item name="description" label="Description">
                            <TextArea rows={4} placeholder="Tell the story behind this track..." />
                        </Form.Item>
                    </Form>
                )}

                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <Title level={4}>Royalty Splits (The Glass Box)</Title>
                            <Text type="secondary">Add collaborators to automatically split revenue.</Text>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <Title level={5} style={{ margin: 0 }}>Collaborators</Title>
                                <Button onClick={addCollaborator} type="dashed">Add +</Button>
                            </div>

                            {collaborators.length === 0 ? (
                                <div className="text-center py-4 text-gray-400">
                                    No splits added. 100% goes to you.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {collaborators.map((c, i) => (
                                        <div key={i} className="flex justify-between bg-white p-2 rounded border">
                                            <span className="font-mono">{c.address.slice(0, 6)}...{c.address.slice(-4)}</span>
                                            <span className="font-bold text-green-600">{c.share}%</span>
                                        </div>
                                    ))}
                                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                                        <span>Total</span>
                                        <span className={collaborators.reduce((a, b) => a + b.share, 0) !== 100 ? "text-red-500" : "text-green-600"}>
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
                                className="bg-gradient-to-r from-purple-500 to-pink-500 border-0"
                            >
                                Deploy Payment Splitter Contract
                            </Button>
                        )}

                        {splitterAddress && (
                            <div className="text-center p-4 bg-green-50 border border-green-200 rounded">
                                <Text type="success">Splitter Deployed: {splitterAddress}</Text>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 4 && ipfsResult && (
                    <div className="text-center py-8">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-8 inline-block">
                            <Title level={5} type="success" style={{ margin: 0 }}>Ready to Mint!</Title>
                            <Text>Metadata CID: {ipfsResult.metadataCid}</Text>
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
            </Card>

            <div className="flex justify-between">
                <Button disabled={currentStep === 0 || currentStep === 4} onClick={() => setCurrentStep(currentStep - 1)}>
                    Back
                </Button>
                {/* Hide Next button if on Splits step with pending deployment logic, forcing use of main CTA */}
                {currentStep < 4 && currentStep !== 3 && (
                    <Button type="primary" onClick={handleNext} loading={uploading}>
                        {currentStep === 2 ? 'Upload files to IPFS' : 'Next'}
                    </Button>
                )}
                {currentStep === 3 && (
                    <Button
                        type="primary"
                        onClick={handleNext}
                        disabled={collaborators.length > 0 && !splitterAddress}
                    >
                        {collaborators.length === 0 ? 'Skip Splits' : 'Next'}
                    </Button>
                )}
            </div>
        </div>
    );
}

export default withArtistAuth(UploadTrackPage);
