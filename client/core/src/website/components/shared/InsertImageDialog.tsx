/**
 * This component used to show a dialog that users can upload images from their disk, then insert it into markdown
 */
import React, { RefObject } from "react";
import { MessageDescriptor, FormattedMessage, injectIntl, WrappedComponentProps as IntlProps  } from "react-intl";
import { PrimitiveType } from "intl-messageformat";
import { Modal, Form } from "semantic-ui-react";
import FileSelectButton from "./FileSelectButton";
import fetch from "../../../shared/fetch";
import { getToast as toast } from "../../../shared/toast";
import { amendImageUrl } from "../../../shared/image";

interface Props extends IntlProps {
    open: boolean;
    onCancel: () => void;
    onConfirm: (description: string, link: string) => void;
}

interface States {
    valid: boolean;
    uploading: boolean;
}

class InsertImageDialog extends React.Component<Props, States> {
    private descriptionRef: RefObject<HTMLInputElement>;
    private linkRef: RefObject<HTMLInputElement>;
    constructor(props: Props) {
        super(props);
        this.descriptionRef = React.createRef();
        this.linkRef = React.createRef();
        this.state = {
            valid: false,
            uploading: false
        };
    }
    render () {
        const message: (descriptor: MessageDescriptor, values?: Record<string, PrimitiveType>) => string = this.props.intl.formatMessage;
        return <Modal open={this.props.open}>
            <Modal.Header>
                <FormattedMessage id="page.insert_image.title"/>
            </Modal.Header>
            <Modal.Content>
                <Form>
                    <Form.Field width={16}>
                        <label>
                            <FormattedMessage id="page.insert_image.fill_description"/>
                        </label>
                        <input ref={this.descriptionRef} onChange={this.startEditing}/>
                    </Form.Field>
                    <Form.Field width={16}>
                        <label>
                            <FormattedMessage id="page.insert_image.fill_link"/>
                        </label>
                        <input ref={this.linkRef} onChange={this.startEditing}/>
                    </Form.Field>
                    <Form.Group inline>
                        <label>
                            <FormattedMessage id="page.insert_image.upload"/>
                        </label>
                        <FileSelectButton onChange={this.onImageSelected}/>
                    </Form.Group>
                </Form>
            </Modal.Content>
            <Modal.Actions actions={[
                {
                    key: "cancel",
                    content: message({id: "component.button.cancel"}),
                    positive: false,
                    onClick: this.props.onCancel
                },
                {
                    key: "confirm",
                    content: message({id: "component.button.confirm"}),
                    positive: true,
                    onClick: this.onConfirm,
                    disabled: !this.state.valid
                }
            ]} />
        </Modal>;
    }

    private onImageSelected = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (e.target.files && e.target.files.length > 0) {
            this.setState({uploading: true});
            const blob: File = e.target.files[0] as File;
            // TODO: How to update the progress bar?
            fetch("/api/image/upload/thread", blob, "PUT", true)
            .then((json: any) => {
                if (json && json.url && this.descriptionRef.current && this.linkRef.current) {
                    const filenameWithoutExtension: string = blob.name.substr(0, blob.name.lastIndexOf("."));
                    this.descriptionRef.current.value = filenameWithoutExtension.replace(/[.,?![\]()"'`;:\\/]/g, "");
                    this.linkRef.current.value = amendImageUrl(json.url);
                    this.setState({
                        valid: true,
                        uploading: false
                    });
                } else {
                    toast().error("toast.post.insert_image_failed");
                }
            }, (error: Error) => {
                toast().error("toast.post.insert_image_failed");
            });
        }
    };
    private startEditing = (): void => {
        const valid: boolean =
            !!this.descriptionRef.current &&
            !!this.descriptionRef.current.value &&
            !!this.linkRef.current &&
            !!this.linkRef.current.value;
        this.setState({valid: valid});
    }

    private onConfirm = () => {
        const description: string | null = this.descriptionRef.current && this.descriptionRef.current.value;
        const link: string | null = this.linkRef.current && this.linkRef.current.value;
        if (description && link) {
            // Remove special characters before complete
            this.props.onConfirm(description, link);
        } else {
            console.error("Unexpected behavior");
        }
    }
}

export default injectIntl(InsertImageDialog);