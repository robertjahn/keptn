package models

import (
	"context"
	"strconv"

	"github.com/go-openapi/errors"
	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// Project project
//
// swagger:model Project
type Project struct {

	// Git remote URI
	GitRemoteURI string `json:"gitRemoteURI,omitempty"`

	// Git token
	GitToken string `json:"gitToken,omitempty"`

	// Git User
	GitUser string `json:"gitUser,omitempty"`

	// Project name
	ProjectName string `json:"projectName,omitempty"`

	// stages
	Stages []*Stage `json:"stages"`
}

// Validate validates this project
func (m *Project) Validate(formats strfmt.Registry) error {
	var res []error

	if err := m.validateStages(formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *Project) validateStages(formats strfmt.Registry) error {
	if swag.IsZero(m.Stages) { // not required
		return nil
	}

	for i := 0; i < len(m.Stages); i++ {
		if swag.IsZero(m.Stages[i]) { // not required
			continue
		}

		if m.Stages[i] != nil {
			if err := m.Stages[i].Validate(formats); err != nil {
				if ve, ok := err.(*errors.Validation); ok {
					return ve.ValidateName("stages" + "." + strconv.Itoa(i))
				} else if ce, ok := err.(*errors.CompositeError); ok {
					return ce.ValidateName("stages" + "." + strconv.Itoa(i))
				}
				return err
			}
		}

	}

	return nil
}

// ContextValidate validate this project based on the context it is used
func (m *Project) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	var res []error

	if err := m.contextValidateStages(ctx, formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *Project) contextValidateStages(ctx context.Context, formats strfmt.Registry) error {

	for i := 0; i < len(m.Stages); i++ {

		if m.Stages[i] != nil {
			if err := m.Stages[i].ContextValidate(ctx, formats); err != nil {
				if ve, ok := err.(*errors.Validation); ok {
					return ve.ValidateName("stages" + "." + strconv.Itoa(i))
				} else if ce, ok := err.(*errors.CompositeError); ok {
					return ce.ValidateName("stages" + "." + strconv.Itoa(i))
				}
				return err
			}
		}

	}

	return nil
}
